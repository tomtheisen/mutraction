import { ProxyOf, RecordDependency, RecordMutation, TrackerOf } from "./symbols.js";
import { DependencyList } from "./dependency.js";
import { compactTransaction } from "./compactTransaction.js";
import type { Mutation, ReadonlyDeep, SingleMutation, Transaction } from "./types.js";
import { PropReference, createOrRetrievePropRef } from "./propref.js";
import { isTracked, makeProxyHandler } from "./proxy.js";

type Subscriber = (mutation: SingleMutation | undefined) => void;

const defaultTrackerOptions = {
    trackHistory: true,
    autoTransactionalize: false,
    deferNotifications: false,
    compactOnCommit: true,
};

export type TrackerOptions = Partial<typeof defaultTrackerOptions>;

export class Tracker {
    #subscribers: Set<Subscriber> = new Set;
    #transaction?: Transaction;
    #rootTransaction?: Transaction;
    #redos: Mutation[] = [];
    options: Readonly<Required<TrackerOptions>>;
    #historyPropRef: PropReference | undefined;

    constructor(options: TrackerOptions = {}) {
        if (options.trackHistory === false && options.compactOnCommit == null) {
            // user specified no history tracking, so turn off compactOnCommit which requires it
            options.compactOnCommit = false;
        }

        const appliedOptions = { ...defaultTrackerOptions, ...options };
        if (appliedOptions.autoTransactionalize && !appliedOptions.trackHistory)
            throw Error("Option autoTransactionalize requires option trackHistory");
        if (appliedOptions.compactOnCommit && !appliedOptions.trackHistory) {
            throw Error("Option compactOnCommit requires option trackHistory");
        }

        if (appliedOptions.trackHistory) {
            // create root transaction to enable history tracking
            this.#rootTransaction = this.#transaction = { type: "transaction", operations: [] };
        }
        this.options = Object.freeze(appliedOptions);
    }

    // turn on change tracking
    // returns a proxied model object, and tracker to control history
    track<TModel extends object>(model: TModel): TModel {
        if (isTracked(model)) throw Error('Object already tracked');
        const proxied = new Proxy(model, makeProxyHandler(model, this));

        Object.defineProperty(model, ProxyOf, {
            enumerable: false,
            writable: true,
            configurable: false,
        });
        (model as any)[ProxyOf] = proxied;

        return proxied;
    }

    trackAsReadonlyDeep<TModel extends object>(model: TModel): ReadonlyDeep<TModel> {
        return this.track(model);
    }
    
    subscribe(callback: Subscriber) {
        this.#subscribers.add(callback);
        return { dispose: () => this.#subscribers.delete(callback) };
    }

    #notifySubscribers(mutation: SingleMutation | undefined) {
        if (this.options.deferNotifications) {
            for (const sub of this.#subscribers) queueMicrotask(() => sub(mutation));
        }
        else {
            for (const sub of this.#subscribers) sub(mutation);
        }
    }

    #ensureHistory(): Transaction {
        if (!this.#transaction) throw Error("History tracking disabled.");
        return this.#transaction;
    }

    get history(): ReadonlyArray<Readonly<Mutation>> {
        this.#ensureHistory();

        // reading the history can create a dependency too, not just the tracked model, 
        // for use cases that depend on the tracker history
        this.#dependencyTrackers[0]?.trackAllChanges();

        this.#historyPropRef ??= createOrRetrievePropRef(this, "history");

        if (!this.#rootTransaction) 
            throw Error("History tracking enabled, but no root transaction. Probably mutraction internal error.");

        return this.#rootTransaction.operations; 
    }

    /** add another transaction to the stack  */
    startTransaction(name?: string): Transaction {
        const transaction = this.#ensureHistory();
        this.#transaction = { type: "transaction", parent: transaction, operations: [] };
        if (name) this.#transaction.transactionName = name;
        return this.#transaction;
    }

    /** resolve and close the most recent transaction  
      * throws if no transactions are active 
      */
    commit(transaction?: Transaction) {
        const actualTransaction = this.#ensureHistory();

        if (transaction && transaction !== actualTransaction)
            throw Error('Attempted to commit wrong transaction. Transactions must be resolved in stack order.');
        if (!actualTransaction.parent)
            throw Error('Cannot commit root transaction');

        if (this.options.compactOnCommit) compactTransaction(actualTransaction);

        const parent = actualTransaction.parent;
        parent.operations.push(actualTransaction);
        actualTransaction.parent = undefined;
        this.#transaction = parent;

        if (this.#transaction.parent == null) {
            // top level transaction, notify any history dependency
            this.#notifySubscribers(undefined);
        }
    }

    /** undo all operations done since the beginning of the most recent trasaction
     * remove it from the transaction stack
     * if no transactions are active, undo all mutations
     */
    rollback(transaction?: Transaction) {
        const actualTransaction = this.#ensureHistory();

        if (transaction && transaction !== actualTransaction)
            throw Error('Attempted to commit wrong transaction. Transactions must be resolved in stack order.');

        while (actualTransaction.operations.length) this.undo();
        this.#transaction = actualTransaction.parent ?? actualTransaction;
    }

    /** undo last mutation or transaction and push into the redo stack  */
    undo() {
        const transaction = this.#ensureHistory();
        const mutation = transaction.operations.pop();
        if (!mutation) return;
        this.#undoOperation(mutation);
        this.#redos.unshift(mutation);

        this.#historyPropRef?.notifySubscribers();
    }
    #undoOperation(mutation: Mutation) {
        if (mutation.type === "transaction") {
            for (let i = mutation.operations.length; i-- > 0;) {
                this.#undoOperation(mutation.operations[i]);
            }
        }
        else {
            const targetAny = mutation.target as any;
            switch (mutation.type) {
                case 'change':
                case 'delete': targetAny[mutation.name] = mutation.oldValue; break;
                case 'create': delete targetAny[mutation.name]; break;
                case 'arrayextend': targetAny.length = mutation.oldLength; break;
                case 'arrayshorten': targetAny.push(...mutation.removed); break;
                default: mutation satisfies never;
            }
            this.#notifySubscribers(mutation);
        }
    }

    /** repeat last undone mutation  */
    redo() {
        const transaction = this.#ensureHistory();
        const mutation = this.#redos.shift();
        if (!mutation) return;
        this.#redoOperation(mutation);
        transaction.operations.push(mutation);

        this.#historyPropRef?.notifySubscribers();
    }
    #redoOperation(mutation: Mutation) {
        if (mutation.type === "transaction") {
            for (const operation of mutation.operations) {
                this.#redoOperation(operation);
            }
        }
        else {
            const targetAny = mutation.target as any;
            switch (mutation.type) {
                case 'change':
                case 'create': targetAny[mutation.name] = mutation.newValue; break;
                case 'delete': delete targetAny[mutation.name]; break;
                case 'arrayextend': targetAny[mutation.newIndex] = mutation.newValue; break;
                case 'arrayshorten': targetAny.length = mutation.newLength; break;
                default: mutation satisfies never;
            }
            this.#notifySubscribers(mutation);
        }
    }

    /** clear the redo stack */
    // any direct mutation implicitly does this
    clearRedos() {
        this.#redos.length = 0;
    }
    
    clearHistory() {
        const transaction = this.#ensureHistory();
        transaction.parent = undefined;
        transaction.operations.length = 0;
        this.clearRedos();
        this.#notifySubscribers(undefined);
    }

    /** record a mutation, if you have the secret key  */
    [RecordMutation](mutation: SingleMutation) {
        // if history tracking is enabled
        this.#transaction?.operations.push(Object.freeze(mutation));

        this.clearRedos();
        createOrRetrievePropRef(mutation.target, mutation.name).notifySubscribers();
        this.#notifySubscribers(mutation);

        this.#historyPropRef?.notifySubscribers();
    }

    #dependencyTrackers: DependencyList[] = [];

    startDependencyTrack(): DependencyList {
        let deps = new DependencyList(this);
        this.#dependencyTrackers.unshift(deps);
        return deps;
    }

    endDependencyTrack(dep: DependencyList): DependencyList {
        if (this.#dependencyTrackers[0] !== dep) 
            throw Error('Specified dependency list is not top of stack');

        this.#dependencyTrackers.shift();
        return dep;
    }

    [RecordDependency](propRef: PropReference) {
        this.#dependencyTrackers[0]?.addDependency(propRef);
        if (this.#gettingPropRef) this.#lastPropRef = propRef;
    }

    #gettingPropRef = false;
    #lastPropRef?: PropReference = undefined;
    /**
     * Gets a property reference that refers to a particular property on a particular object.
     * It can get or set the target property value using the `current` property, so it's a valid React ref.
     * If there's an existing PropRef matching the arguments, it will be returned.  
     * A new one will be created only if necessary.
     * @param propGetter parameter-less function that gets the target property value e.g. `() => model.settings.logFile`
     * @returns PropReference for an object property
     */
    getPropRef<T>(propGetter: () => T): PropReference<T> {
        if (this.#gettingPropRef)
            throw Error("Cannot be called re-entrantly.");

        this.#gettingPropRef = true;
        this.#lastPropRef = undefined;
        try {
            const actualValue = propGetter();
            if (!this.#lastPropRef)
                throw Error("No tracked properties.  Prop ref detection requires a tracked object.");
                        
            const propRefCurrent = (this.#lastPropRef as PropReference).current;
            if (!Object.is(actualValue, propRefCurrent))
                console.error(
                    "The last operation of the callback must be a property get.\n"+
                    "`(foo || bar).quux` is allowed, but `foo.bar + 1` is not");

            return this.#lastPropRef;
        }
        finally {
            this.#gettingPropRef = false;
        }
    }
}

export const defaultTracker: Tracker = new Tracker;

export function track<TModel extends object>(model: TModel): TModel {
    return defaultTracker.track(model);
}
