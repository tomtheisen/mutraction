import { Tracker } from "./tracker.js";
import { TrackerOf, RecordDependency, RecordMutation, ProxyOf, GetOriginal } from "./symbols.js";
import type { ArrayExtend, ArrayShorten, DeleteProperty, Key, ReadonlyDeep, SingleMutation } from "./types.js";
import { createOrRetrievePropRef } from "./propref.js";

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

function linkProxyToObject(obj: any, proxy: any) {
    Object.defineProperty(obj, ProxyOf, {
        enumerable: false,
        writable: true,
        configurable: false,
    });
    obj[ProxyOf] = proxy;
}

function isTrackable(val: unknown): val is object {
    if (val == null) return false;
    if (typeof val !== "object") return false;
    if (isTracked(val)) return false;

    // Promise resolution does not tolerate being proxied.
    // So we just skip the whole thing.
    if (val instanceof Promise) return false;

    return true;
}

export function makeProxyHandler<TModel extends object>(model: TModel, tracker: Tracker) : ProxyHandler<TModel> {
    type TKey = (keyof TModel) & Key;
    
    function getOrdinary(target: TModel, name: TKey, receiver: TModel) {
        if (name === TrackerOf) return tracker;
        if (name === GetOriginal) return target;

        tracker[RecordDependency](createOrRetrievePropRef(target, name));

        let result = Reflect.get(target, name, receiver) as TModel[TKey];
        if (isTrackable(result)) {
            const original = result;
            const handler = makeProxyHandler(original, tracker);
            result = target[name] = new Proxy(original, handler) as typeof target[TKey];
            linkProxyToObject(original, result);
        }
        if (typeof result === 'function' && tracker.options.autoTransactionalize && name !== "constructor") {
            const original = result as Function;
            function proxyWrapped() {
                const autoTransaction = tracker.startTransaction(original.name ?? "auto");
                try {
                    return original.apply(receiver, arguments);
                }
                finally {
                    if (autoTransaction.operations.length > 0) {
                        tracker.commit(autoTransaction);
                    }
                    else {
                        // don't commit auto transactions in which nothing changed
                        tracker.rollback(autoTransaction);
                    }
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
        if (typeof newValue === 'object' && !newValue[TrackerOf]) {
            const handler = makeProxyHandler(newValue, tracker);
            newValue = new Proxy(newValue, handler);
        }

        const mutation: SingleMutation = name in target
            ? { type: "change", target, name, oldValue: model[name], newValue }
            : { type: "create", target, name,                        newValue };
        
        const initialSets = setsCompleted;
        const wasSet = Reflect.set(target, name, newValue, receiver);
        if (wasSet && initialSets == setsCompleted++) {
            // no other set operation completed while this one was being executed
            // if there *was* one or more, we want to record those instead of this
            tracker[RecordMutation](mutation);
        }
        return wasSet;
    }

    function setArray(target: TModel, name: TKey, newValue: any, receiver: TModel) {
        if (!Array.isArray(target)) {
            throw Error('This object used to be an array.  Expected an array.');
        }
        if (name === "length") {
            if (!isArrayLength(newValue)) target.length = newValue; // let it throw ❄️
            
            const oldLength = target.length;
            const newLength = parseInt(newValue, 10);
            
            if (newLength < oldLength) {
                const removed = Object.freeze(target.slice(newLength, oldLength));
                const shorten: ArrayShorten = {
                    type: "arrayshorten", target, name, oldLength, newLength, removed
                };
                const wasSet = Reflect.set(target, name, newValue, receiver);
                tracker[RecordMutation](shorten);
                ++setsCompleted;
                return wasSet;
            }
        }
        
        if (isArrayIndex(name)) {
            const index = parseInt(name, 10);
            if (index >= target.length) {
                // assignment to array index will lengthen array    
                const extension: ArrayExtend = { 
                    type: "arrayextend", target, name, oldLength: target.length, newIndex: index, newValue
                };
                const wasSet = Reflect.set(target, name, newValue, receiver);
                tracker[RecordMutation](extension);
                ++setsCompleted;
                return wasSet;
            }
        }

        return setOrdinary(target, name, newValue, receiver);
    }

    function deleteProperty(target: TModel, name: TKey) {
        const mutation: DeleteProperty = { type: "delete", target, name, oldValue: model[name] };
        const wasDeleted = Reflect.deleteProperty(target, name);
        if (wasDeleted) {
            tracker[RecordMutation](mutation);
        }
        return wasDeleted;
    }

    let set = setOrdinary, get = getOrdinary;
    if (Array.isArray(model)) {
        set = setArray;
        if (tracker.options.trackHistory) get = getArrayTransactionShim;
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
