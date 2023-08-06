import { Tracker, TrackerOptions } from "./tracker.js";
import { IsTracked, LastChangeGeneration, RecordDependency, RecordMutation } from "./symbols.js";
import type { ArrayExtend, ArrayShorten, DeleteProperty, Key, ReadonlyDeep, SingleMutation } from "./types.js";

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

function makeProxyHandler<TModel extends object>(model: TModel, tracker: Tracker) : ProxyHandler<TModel> {
    type TKey = (keyof TModel) & Key;
    
    function getOrdinary(target: TModel, name: TKey, receiver: TModel) {
        if (name === IsTracked) return true;
        if (name === LastChangeGeneration) return (target as any)[LastChangeGeneration];

        tracker[RecordDependency](target, name);

        let result = Reflect.get(target, name, receiver) as any;
        if (typeof result === 'object' && !isTracked(result)) {
            const handler = makeProxyHandler(result, tracker);
            result = target[name] = new Proxy(result, handler);
        }
        if (typeof result === 'function' && tracker.options.autoTransactionalize && name !== "constructor") {
            const original = result as Function;
            function proxyWrapped() {
                const autoTransaction = tracker.startTransaction(original.name ?? "auto");
                try {
                    const result = original.apply(receiver, arguments);
                    if (autoTransaction.operations.length > 0) {
                        tracker.commit(autoTransaction);
                    }
                    else {
                        // don't commit auto transactions in which nothing changed
                        tracker.rollback(autoTransaction);
                    }
                    return result;
                }
                catch (er) {
                    tracker.rollback(autoTransaction);
                    throw er;
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
        if (typeof newValue === 'object' && !newValue[IsTracked]) {
            const handler = makeProxyHandler(newValue, tracker);
            newValue = new Proxy(newValue, handler);
        }

        const mutation: SingleMutation = name in target
            ? { type: "change", target, name, oldValue: model[name], newValue }
            : { type: "create", target, name,                        newValue };
        
        const initialSets = setsCompleted;
        const wasSet = Reflect.set(target, name, newValue, receiver);
        if (initialSets == setsCompleted) {
            // no other set operation completed while this one was being executed
            // if there *was* one or more, we want to record those instead of this
            tracker[RecordMutation](mutation);
        }
        ++setsCompleted;
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
                tracker[RecordMutation](shorten);
                ++setsCompleted;
                return Reflect.set(target, name, newValue, receiver);
            }
        }
        
        if (isArrayIndex(name)) {
            const index = parseInt(name, 10);
            if (index >= target.length) {
                // assignment to array index will lengthen array    
                const extension: ArrayExtend = { 
                    type: "arrayextend", target, name, oldLength: target.length, newIndex: index, newValue
                };
                tracker[RecordMutation](extension);
                ++setsCompleted;
                return Reflect.set(target, name, newValue, receiver);
            }
        }

        return setOrdinary(target, name, newValue, receiver);
    }

    function deleteProperty(target: TModel, name: TKey) {
        const mutation: DeleteProperty = { type: "delete", target, name, oldValue: model[name] };
        tracker[RecordMutation](mutation);
        return Reflect.deleteProperty(target, name);
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

export function isTracked(obj: object) {
    return typeof obj === "object" && !!(obj as any)[IsTracked];
}

// turn on change tracking
// returns a proxied model object, and tracker to control history
export function track<TModel extends object>(model: TModel, options?: TrackerOptions): [TModel, Tracker] {
    if (isTracked(model)) throw Error('Object already tracked');
    const tracker = new Tracker(options);
    const proxied = new Proxy(model, makeProxyHandler(model, tracker));
    return [proxied, tracker];
}

export function trackAsReadonlyDeep<TModel extends object>(model: TModel, options?: TrackerOptions): [ReadonlyDeep<TModel>, Tracker] {
    return track(model, options);
}
