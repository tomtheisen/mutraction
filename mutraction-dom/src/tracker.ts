import type { Key, ReadonlyDeep, Subscription, Transaction } from "./types.js";
import { RecordDependency, RecordMutation, RecordSplice } from "./symbols.js";
import { DependencyList, PropRefChangeInfo } from "./dependency.js";
import { PropReference, createOrRetrievePropRef } from "./propref.js";
import { isArrayIndex, isTracked, linkProxyToObject, makeProxyHandler } from "./proxy.js";
import { getExistingProxy, canBeProxied } from "./proxy.js";
import { assertSafeMapKey } from "./proxy.map.js";

const defaultTrackerOptions = {
    autoTransactionalize: true,
};

export type TrackerOptions = Partial<typeof defaultTrackerOptions>;

/**
 * Oversees object mutations and allows history manipulation.
 * @see track
 */
export class Tracker {
    #transaction?: Transaction;
    #dependencyTrackers: DependencyList[] = [];
    #subscribers = new Set<(propRef?: PropReference) => void>; // mutation subscribers

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
        if (this.#transaction) {
            ++this.#transaction.depth;
        }
        else {
            this.#transaction = { type: "transaction", depth: 1, ordinaryChanges: new Set, arrayChanges: new Map };
            if (name) this.#transaction.transactionName = name;
        }
        return this.#transaction;
    }

    /** resolve and close the most recent transaction  
      * throws if no transactions are active 
      */
    commit() {
        if (!this.#transaction) 
            throw Error('Attempted to commit transaction when none were open.');

        if (this.#transaction.depth > 1) {
            --this.#transaction.depth;
        }
        else {
            const notified = new Set<DependencyList>;
            for (const propRef of this.#transaction.ordinaryChanges) {
                for (const dependencyList of propRef.subscribers) {
                    if (!notified.has(dependencyList)) {
                        dependencyList.notifySubscribers();
                        notified.add(dependencyList);
                    }
                }
            }

            this.#transaction = undefined;
            this.#notifySubscribers();
        }
    }

    /**
     * Subscribe to be notified when a tracked object is mutated.
     * @param callback 
     * @returns a subscription with a dispose() method that can canel the subscription
     */
    subscribe(callback: (prop?: PropReference) => void): Subscription {
        this.#subscribers.add(callback);
        const dispose = () => this.#subscribers.delete(callback);
        return { dispose };
    }

    #notifySubscribers(prop?: PropReference) {
        for (const s of this.#subscribers) s(prop);
    }

    /** 
     * Record an array splice, if you have the secret key.
     * A splice consists of a start index, a number of items to delete, and an array of new items to insert
     */
    [RecordSplice](target: Array<unknown>, start: number, deleteCount: number, insert: any[]) {
        if (this.#transaction) {
            let layers = this.#transaction.arrayChanges.get(target);
            if (!layers) this.#transaction.arrayChanges.set(target, layers = [{ elements: new Map }]);
            let lastLayer = layers.at(-1)!;

            if (deleteCount != insert.length) {
                lastLayer.finalSplice = { newLength: target.length, suffixLength: target.length - start - insert.length };
            }
                
            layers.push(lastLayer = { elements: new Map });
            insert.forEach((item, i) => lastLayer.elements.set(start + i, item));
        }
        else {
            // notify granular prop subscribers
            const lengthPropRef = createOrRetrievePropRef(target, "length");
            const suffixLength = target.length - insert.length - start;
            lengthPropRef.notifySubscribers({ suffixLength });
            this.#notifySubscribers(lengthPropRef);
        }
    }

    /** record a mutation, if you have the secret key  */
    [RecordMutation](target: object, name: Key) {
        const propRef = createOrRetrievePropRef(target, name);
        if (!this.#transaction) {
            // notify granular prop subscribers
            propRef.notifySubscribers();
            this.#notifySubscribers(propRef);
        }
        else if (Array.isArray(target) && isArrayIndex(name)) {
            // array change to index, record in layer
            let layers = this.#transaction.arrayChanges.get(target);
            if (!layers) this.#transaction.arrayChanges.set(target, layers = [{ elements: new Map }]);
            let lastLayer = layers.at(-1)!;
            const idx = parseInt(name as string);
            lastLayer.elements.set(idx, target[idx])
        }
        else {
            // ordinary propref transaction
            this.#transaction.ordinaryChanges.add(propRef);
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
