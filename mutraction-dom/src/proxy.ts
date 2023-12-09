import { Tracker } from "./tracker.js";
import { TrackerOf, RecordDependency, RecordMutation, ProxyOf, GetOriginal, AccessPath } from "./symbols.js";
import type { Key } from "./types.js";
import { createOrRetrievePropRef } from "./propref.js";
import { isDebugMode } from "./debug.js";
import { getSetProxyHandler } from "./proxy.set.js";
import { getMapProxyHandler } from "./proxy.map.js";

const mutatingArrayMethods 
    = ["copyWithin","fill","pop","push","reverse","shift","sort","splice","unshift"];

function isArrayLength(value: string | symbol | number) {
    if (typeof value === "string") return isArrayIndex(value);
    return typeof value === "number" && (value & 0x7fff_ffff) === value;
}

function isArrayIndex(name: string | symbol): name is string {
    // ES 6.1.7 https://tc39.es/ecma262/#array-index
    if (typeof name !== "string") return false;
    if (!/^\d{1,10}$/.test(name)) return false;
    return parseInt(name, 10) < 0x7fff_ffff;
}

function isArguments(item: any): item is IArguments {
    // https://stackoverflow.com/a/29924715
    return Object.prototype.toString.call(item) === '[object Arguments]';
}

export function linkProxyToObject(obj: any, proxy: any) {
    Object.defineProperty(obj, ProxyOf, {
        enumerable: false,
        writable: true,
        configurable: false,
        value: proxy,
    });
}

export function getExistingProxy(value: object) {
    return (value as any)[ProxyOf];
}

// Some types do not tolerate being proxied
const unproxyableConstructors: Set<Function> = new Set([RegExp, Promise]);
// Detect node; node's constructor chains appear slightly different
if ("window" in globalThis) unproxyableConstructors.add(globalThis.window.constructor)

export function canBeProxied(val: unknown): val is object {
    if (val == null) return false;
    if (typeof val !== "object") return false;
    if (isTracked(val)) return false;
    if (!Object.isExtensible(val)) return false;

    if (unproxyableConstructors.has(val.constructor)) return false;

    return true;
}

/** get a new or existing tracker proxy if possible */
export function maybeGetProxy<T>(value: T, tracker: Tracker): T | undefined {
    // rule out the easy cases
    if (typeof value !== "object" || !value) return undefined;
    // this *is* a proxy
    if (isTracked(value)) return value;
    // there *is* a proxy, but we have to look it up
    const existingProxy = getExistingProxy(value);
    if (existingProxy) {
        if (existingProxy[TrackerOf] !== tracker) {
            throw Error("Object cannot be tracked by multiple tracker instances");
        }
        return existingProxy;
    }
    // last resort, need to make a new proxy
    if (canBeProxied(value)) return tracker.track(value);
}

export function getAccessPath(obj: Object): string | undefined {
    return (obj as any)[AccessPath];
}

export function setAccessPath(obj: Object, parentPath: string | undefined, leafSegment: string | symbol) {
    const fullPath = parentPath ? parentPath + "." + String(leafSegment) : String(leafSegment);
    Object.assign(obj, {[AccessPath]: fullPath});
}

export function makeProxyHandler<TModel extends object>(model: TModel, tracker: Tracker) : ProxyHandler<TModel> {
    if (!canBeProxied(model)) throw Error("This object type cannot be proxied");

    if (model instanceof Set) return getSetProxyHandler(tracker) as ProxyHandler<TModel>;
    if (model instanceof Map) return getMapProxyHandler(tracker) as ProxyHandler<TModel>;

    type TKey = (keyof TModel) & Key;
    
    function getOrdinary(target: TModel, name: TKey, receiver: TModel) {
        if (name === TrackerOf) return tracker;
        if (name === GetOriginal) return target;
        if (name === AccessPath) return target[name];

        tracker[RecordDependency](createOrRetrievePropRef(target, name));

        let result = Reflect.get(target, name, receiver) as TModel[TKey];
        if (result && typeof result === "object" && isDebugMode) {
            setAccessPath(result, getAccessPath(target), name);
        }

        const maybeProxy = maybeGetProxy(result, tracker);
        if (maybeProxy) {
            result = target[name] = maybeProxy as any;
        }
        else if (typeof result === 'function' && tracker.options.autoTransactionalize && name !== "constructor") {
            const original = result as Function;
            function proxyWrapped() {
                const autoTransaction = tracker.startTransaction(original.name ?? "auto");
                try {
                    return original.apply(receiver, arguments);
                }
                finally {
                    tracker.commit(autoTransaction);
                }
            }
            return proxyWrapped;
        }
        return result;
    }

    function getArrayTransactionShim(target: TModel, name: TKey, receiver: TModel) {
        if (typeof name === "string" && mutatingArrayMethods.includes(name)) {
            const arrayFunction = target[name] as Function;
            function proxyWrapped() {
                const arrayTransaction = tracker.startTransaction(String(name));
                const arrayResult = arrayFunction.apply(receiver, arguments);
                tracker.commit(arrayTransaction);
                return arrayResult;
            }
            return proxyWrapped;
        }
        else {
            return getOrdinary(target, name, receiver);
        }
    }

    // number of completed set operations.  we only want to record accessor sets, aka "leaf" sets
    // setters that call other setters should not be represented in the history.
    // so if the number of completed sets changes between start and end of parent set, then don't record it
    let setsCompleted = 0;
    function setOrdinary(target: TModel, name: TKey, newValue: any, receiver: TModel) {
        if (name === AccessPath) {
            return Reflect.set(target, AccessPath, newValue);
        }

        if (newValue && typeof newValue === "object" && isDebugMode) {
            setAccessPath(newValue, getAccessPath(target), name);
        }

        newValue = maybeGetProxy(newValue, tracker) ?? newValue;

        const initialSets = setsCompleted;
        const wasSet = Reflect.set(target, name, newValue, receiver);
        if (wasSet && initialSets == setsCompleted++) {
            // no other set operation completed while this one was being executed
            // if there *was* one or more, we want to record those instead of this
            tracker[RecordMutation](target, name);
        }
        return wasSet;
    }

    function setArray(target: TModel, name: TKey, newValue: any, receiver: TModel) {
        if (!Array.isArray(target)) {
            throw Error('This object used to be an array.  Expected an array.');
        }
        
        if (isArrayIndex(name)) {
            const index = parseInt(name, 10);
            if (index >= target.length) {
                const wasSet = Reflect.set(target, name, newValue, receiver);
                // tracker[RecordMutation](target, name);
                tracker[RecordMutation](target, "length");
                ++setsCompleted;
                return wasSet;
            }
        }

        return setOrdinary(target, name, newValue, receiver);
    }

    function deleteProperty(target: TModel, name: TKey) {
        const wasDeleted = Reflect.deleteProperty(target, name);
        if (wasDeleted) tracker[RecordMutation](target, name);
        return wasDeleted;
    }

    let set = setOrdinary, get = getOrdinary;
    if (Array.isArray(model)) {
        set = setArray;
        get = getArrayTransactionShim;
    }
    
    if (isArguments(model)) throw Error('Tracking of exotic arguments objects not supported');

    // possibly unhandled exotic objects: integer-indexed, module namespaces, immutable prototypes

    return { get, set, deleteProperty };
}

/**
 * checks whether the input is an object currently tracked by this instance of mutraction
 * @param obj value to check
 * @returns true if and only if the input is a proxy-wrapped object
 */
export function isTracked(obj: object) {
    return typeof obj === "object" && !!(obj as any)[TrackerOf];
}
