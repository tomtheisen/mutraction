import { RecordDependency, RecordMutation } from "./symbols.js";
import { DependencyList } from "./dependency.js";
import { compactTransaction } from "./compactTransaction.js";
import type { Mutation, SingleMutation, Transaction } from "./types.js";
import { PropReference, SetGeneration, createOrRetrievePropRef } from "./propref.js";

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
    #generation = 0;
    options: Readonly<Required<TrackerOptions>>;

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
        for (const dt of this.#dependencyTrackers) {
            dt.trackAllChanges();
        }

        if (!this.#rootTransaction) 
            throw Error("History tracking enabled, but no root transaction. Probably mutraction internal error.");

        return this.#rootTransaction.operations; 
    }

    get generation() { return this.#generation; }

    #advanceGeneration() {
        ++this.#generation;
    }

    // add another transaction to the stack
    startTransaction(name?: string): Transaction {
        const transaction = this.#ensureHistory();
        this.#transaction = { type: "transaction", parent: transaction, operations: [] };
        if (name) this.#transaction.transactionName = name;
        return this.#transaction;
    }

    // resolve and close the most recent transaction
    // throws if no transactions are active
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
            this.#advanceGeneration();
            this.#notifySubscribers(undefined);
        }
    }

    // undo all operations done since the beginning of the most recent trasaction
    // remove it from the transaction stack
    // if no transactions are active, undo all mutations
    rollback(transaction?: Transaction) {
        const actualTransaction = this.#ensureHistory();

        if (transaction && transaction !== actualTransaction)
            throw Error('Attempted to commit wrong transaction. Transactions must be resolved in stack order.');

        let didSomething = false;
        while (actualTransaction.operations.length) {
            this.undo();
            didSomething = true;
        }
        this.#transaction = actualTransaction.parent ?? actualTransaction;
        if (didSomething) this.#advanceGeneration();
    }

    // undo last mutation or transaction and push into the redo stack
    undo() {
        const transaction = this.#ensureHistory();
        const mutation = transaction.operations.pop();
        if (!mutation) return;
        this.#advanceGeneration();
        this.#undoOperation(mutation);
        this.#redos.unshift(mutation);
    }
    #undoOperation(mutation: Mutation) {
        if (mutation.type === "transaction") {
            for (let i = mutation.operations.length; i-- > 0;) {
                this.#undoOperation(mutation.operations[i]);
            }
        }
        else {
            this.#setLastChangeGeneration(mutation);
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

    // repeat last undone mutation
    redo() {
        const transaction = this.#ensureHistory();
        const mutation = this.#redos.shift();
        if (!mutation) return;
        this.#advanceGeneration();
        this.#redoOperation(mutation);
        transaction.operations.push(mutation);
    }
    #redoOperation(mutation: Mutation) {
        if (mutation.type === "transaction") {
            for (const operation of mutation.operations) {
                this.#redoOperation(operation);
            }
        }
        else {
            this.#setLastChangeGeneration(mutation);
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

    // clear the redo stack  
    // any direct mutation implicitly does this
    clearRedos() {
        this.#redos.length = 0;
    }
    
    clearHistory() {
        const transaction = this.#ensureHistory();
        transaction.parent = undefined;
        transaction.operations.length = 0;
        this.clearRedos();
        this.#advanceGeneration(); // history can be a dependency
        this.#notifySubscribers(undefined);
    }

    // record a mutation, if you have the secret key
    [RecordMutation](mutation: SingleMutation) {
        // if history tracking is enabled
        this.#transaction?.operations.push(Object.freeze(mutation));

        this.clearRedos();
        this.#advanceGeneration();
        this.#setLastChangeGeneration(mutation);
        this.#notifySubscribers(mutation);
    }

    #setLastChangeGeneration(mutation: SingleMutation) {
        createOrRetrievePropRef(mutation.target, mutation.name)[SetGeneration](this.generation);
    }

    #dependencyTrackers: Set<DependencyList> = new Set;

    startDependencyTrack(): DependencyList {
        let deps = new DependencyList(this);
        this.#dependencyTrackers.add(deps);
        return deps;
    }

    endDependencyTrack(dep: DependencyList): DependencyList {
        const wasTracking = this.#dependencyTrackers.delete(dep);
        if (!wasTracking) throw Error('Dependency tracker was not active on this tracker');
        return dep;
    }

    [RecordDependency](propRef: PropReference) {
        for (const dt of this.#dependencyTrackers) {
            dt.addDependency(propRef);
        }
        if (this.#gettingPropRef) {
            this.#lastPropRef = propRef;
        }
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
