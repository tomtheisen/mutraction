import type { Mutation, ReadonlyDeep, SingleMutation, Subscription, Transaction } from "./types.js";
import { RecordDependency, RecordMutation } from "./symbols.js";
import { DependencyList } from "./dependency.js";
import { compactTransaction } from "./compactTransaction.js";
import { PropReference, createOrRetrievePropRef } from "./propref.js";
import { getAccessPath, isTracked, linkProxyToObject, makeProxyHandler } from "./proxy.js";
import { isDebugMode } from "./debug.js";
import { getExistingProxy, canBeProxied } from "./proxy.js";
import { assertSafeMapKey } from "./proxy.map.js";

const defaultTrackerOptions = {
    autoTransactionalize: true,
    compactOnCommit: true,
};

export type TrackerOptions = Partial<typeof defaultTrackerOptions>;

/**
 * Oversees object mutations and allows history manipulation.
 * @see track
 */
export class Tracker {
    #transaction?: Transaction;
    #redos: Mutation[] = [];
    #dependencyTrackers: DependencyList[] = [];
    #subscribers = new Set<(change?: Mutation) => void>;

    options: Readonly<Required<TrackerOptions>> = defaultTrackerOptions;

    constructor(options: TrackerOptions = {}) {
        this.setOptions(options);
    }

    setOptions(options: TrackerOptions = {}) {
        this.options = Object.freeze({ ...defaultTrackerOptions, ...options });
    }

    /**
     * Turn on change tracking for an object.
     * @param model 
     * @returns a proxied model object 
     */
    track<TModel extends object>(model: TModel): TModel {
        if (isTracked(model)) throw Error('Object already tracked');
        prepareForTracking(model, this);
        const proxied = new Proxy(model, makeProxyHandler(model, this));
        linkProxyToObject(model, proxied);
        return proxied;
    }

    /**
     * Turn on change tracking for an object.  This is behaviorally identical
     * to `track()`.  It differs only in the typescript return type, which is a deep
     * read-only type wrapper.  This might be useful if you want to enforce all mutations
     * to be done through methods.
     * @param model 
     * @returns a proxied model object 
     */    
    trackAsReadonlyDeep<TModel extends object>(model: TModel): ReadonlyDeep<TModel> {
        return this.track(model) as ReadonlyDeep<TModel>;
    }
    
    /** Add another transaction to the stack  */
    startTransaction(name?: string): Transaction {
        this.#transaction = { type: "transaction", parent: this.#transaction, operations: [], dependencies: new Set, timestamp: new Date };
        if (name) this.#transaction.transactionName = name;
        return this.#transaction;
    }

    /** resolve and close the most recent transaction  
      * throws if no transactions are active 
      */
    commit(transaction?: Transaction) {
        if (!this.#transaction) 
            throw Error('Attempted to commit transaction when none were open.');

        if (transaction && transaction !== this.#transaction)
            throw Error('Attempted to commit wrong transaction. Transactions must be resolved in stack order.');

        if (this.options.compactOnCommit) compactTransaction(this.#transaction);

        if (this.#transaction.parent) {
            this.#transaction.parent.operations.push(this.#transaction);
            this.#transaction.dependencies.forEach(d => this.#transaction!.parent!.dependencies.add(d));
            this.#transaction = this.#transaction.parent;
        }
        else {
            // dedupe
            const allDependencyLists = new Set<DependencyList>;
                for (const propRef of this.#transaction.dependencies) {
                for (const dependencyList of propRef.subscribers) {
                    allDependencyLists.add(dependencyList);
                }
            }
            for (const depList of allDependencyLists) {
                depList.notifySubscribers();
            }

            this.#transaction = undefined;
        }

        if (this.#transaction == null) {
            // top level transaction, notify any history dependency
            this.#notifySubscribers();
        }
    }

    subscribe(callback: (change?: Mutation) => void): Subscription {
        this.#subscribers.add(callback);
        const dispose = () => this.#subscribers.delete(callback);
        return { dispose };
    }

    #notifySubscribers(change?: Mutation) {
        for (const s of this.#subscribers) s(change);
    }

    /** undo all operations done since the beginning of the most recent trasaction
     * remove it from the transaction stack
     * if no transactions are active, undo all mutations
     */
    rollback(transaction?: Transaction) {
        if (transaction && transaction !== this.#transaction)
            throw Error('Attempted to commit wrong transaction. Transactions must be resolved in stack order.');

        if (!this.#transaction)
            throw Error('No transaction to rollback.');

        while (this.#transaction.operations.length) this.undo();
        this.#transaction = this.#transaction.parent;
    }

    /** undo last mutation or transaction and push into the redo stack  */
    undo() {
        const mutation = this.#transaction?.operations?.pop();
        if (!mutation) throw Error("There must be an open transaction to undo.");

        this.#undoOperation(mutation);
        this.#redos.unshift(mutation);

        if (this.#transaction == null) { // top-level transaction
            this.#notifySubscribers();
        }
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
                
                case 'setadd': targetAny.delete(mutation.newValue); break;
                case 'setdelete': targetAny.add(mutation.oldValue); break;
                case 'setclear': mutation.oldValues.forEach(targetAny.add.bind(targetAny)); break;
                
                case 'mapcreate': targetAny.delete(mutation.key); break;
                case 'mapchange': 
                case 'mapdelete': targetAny.set(mutation.key, mutation.oldValue); break;
                case 'mapclear': mutation.oldEntries.forEach(([k, v]) => targetAny.set(k, v)); break;

                default: mutation satisfies never;
            }
            if (!this.#transaction) {
                createOrRetrievePropRef(mutation.target, mutation.name).notifySubscribers();
                if (mutation.type === "arrayextend" || mutation.type === "arrayshorten") {
                    createOrRetrievePropRef(mutation.target, "length").notifySubscribers();
                }
            }
        }
    }

    /** Repeat last undone mutation  */
    redo() {
        const mutation = this.#redos.shift();
        if (!mutation) return;
        this.#redoOperation(mutation);
        this.#transaction?.operations.push(mutation);

        if (this.#transaction == null) { // top-level transaction
            this.#notifySubscribers();
        }
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
                
                case 'setadd': targetAny.add(mutation.newValue); break;
                case 'setdelete': targetAny.delete(mutation.oldValue); break;
                case 'setclear': targetAny.clear(); break;
                
                case 'mapcreate':
                case 'mapchange': targetAny.set(mutation.key, mutation.newValue); break;
                case 'mapdelete': targetAny.delete(mutation.key); break;
                case 'mapclear': targetAny.clear(); break;

                default: mutation satisfies never;
            }
            if (!this.#transaction) {
                createOrRetrievePropRef(mutation.target, mutation.name).notifySubscribers();
                if (mutation.type === "arrayextend" || mutation.type === "arrayshorten") {
                    createOrRetrievePropRef(mutation.target, "length").notifySubscribers();
                }
            }
        }
    }

    /** Clear the redo stack. Any direct mutation implicitly does this.
     */
    clearRedos() {
        this.#redos.length = 0;
    }
    
    /** record a mutation, if you have the secret key  */
    [RecordMutation](mutation: SingleMutation) {
        if (isDebugMode) mutation.targetPath = getAccessPath(mutation.target);
        this.#transaction?.operations.push(Object.freeze(mutation));

        this.clearRedos();

        if (this.#transaction) {
            this.#transaction.dependencies.add(createOrRetrievePropRef(mutation.target, mutation.name));
            if (mutation.type === "arrayextend" || mutation.type === "arrayshorten") {
                this.#transaction.dependencies.add(createOrRetrievePropRef(mutation.target, "length"));
            }
        }
        else {
            // notify granular prop subscribers
            createOrRetrievePropRef(mutation.target, mutation.name).notifySubscribers();
            if (mutation.type === "arrayextend" || mutation.type === "arrayshorten") {
                createOrRetrievePropRef(mutation.target, "length").notifySubscribers();
            }
            this.#notifySubscribers();
        }
    }

    /** Run the callback without calling any subscribers */
    ignoreUpdates(callback: () => void) {
        const dep = this.startDependencyTrack();
        dep.active = false;
        callback();
        dep.endDependencyTrack();
    }

    /** Create a new `DependencyList` from this tracker  */
    startDependencyTrack(): DependencyList {
        const deps = new DependencyList(this);
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
        if (this.#gettingPropRef) {
            // ensure we don't notify any dependency trackers
            // merely retrieving a property reference doesn't count as a real access
            this.#lastPropRef = propRef;
        }
        else {
            this.#dependencyTrackers[0]?.addDependency(propRef);
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
        const result = this.getPropRefTolerant(propGetter);
        if (!result) throw Error("No tracked properties.  Prop ref detection requires a tracked object.");
        return result;
    }

    getPropRefTolerant<T>(propGetter: () => T): PropReference<T> | undefined {
        if (this.#gettingPropRef) throw Error("Cannot be called re-entrantly.");

        this.#gettingPropRef = true;
        this.#lastPropRef = undefined;
        try {
            const actualValue = propGetter();
            if (!this.#lastPropRef) return undefined;
                        
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

/** This is the default `Tracker` instance, and the one used for all JSX node updates
 * @see Tracker
 */
export const defaultTracker = new Tracker;

/**
 * This is the main entry point of mutraction.  This returns a tracked proxy wrapping
 * the provided input object.  Always uses the default `Tracker`.
 * @see Tracker
 * @param model is a model object.  Primitive values cannot be tracked, since they cannot be mutated. 
 * @returns a proxy-wrapped representation of the model object
 */
export function track<TModel extends object>(model: TModel): TModel {
    return defaultTracker.track(model);
}

function prepareForTracking(value: any, tracker: Tracker) {
    if (value instanceof Set) {
        const snap = Array.from(value);

        for (const e of snap) {
            const proxy = getExistingProxy(e);
            if (proxy) {
                value.delete(e);
                value.add(proxy);
            }
            else if (canBeProxied(e)) {
                value.delete(e);
                value.add(tracker.track(e));
            }
        };
    }
    else if (value instanceof Map) {
        const snap = Array.from(value);
        for (const [k, v] of snap) {
            assertSafeMapKey(k);
            const proxy = getExistingProxy(v);
            if (proxy) value.set(k, proxy);
            else if (canBeProxied(v)) value.set(k, tracker.track(v));
        }
    }
}
