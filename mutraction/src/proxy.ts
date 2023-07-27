import { Tracker, TrackerOptions } from "./tracker.js";
import { Detach, GetTracker, IsTracked, LastChangeGeneration, RecordDependency, RecordMutation } from "./symbols.js";
import type { ArrayExtend, ArrayShorten, DeleteProperty, Key, SingleMutation } from "./types.js";

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

function isArguments(item: any) {
    https://stackoverflow.com/a/29924715
    return Object.prototype.toString.call(item) === '[object Arguments]';
}

function makeProxyHandler<TModel extends object>(
    model: TModel,
    tracker: Tracker,
) : ProxyHandler<TModel> {
    type TKey = (keyof TModel) & Key;

    let detached = false;

    function getOrdinary(target: TModel, name: TKey, receiver: TModel) {
        if (detached) return Reflect.get(target, name);
        if (name === IsTracked) return true;
        if (name === GetTracker) return tracker;
        if (name === LastChangeGeneration) return (target as any)[LastChangeGeneration];
        if (name === Detach) return () => { detached = true; return target };

        tracker[RecordDependency](target);

        let result = target[name] as any;
        if (typeof result === 'object' && !isTracked(result)) {
            const handler = makeProxyHandler(result, tracker);
            result = target[name] = new Proxy(result, handler);
        }
        return result;
    }

    function getArrayTransactionShim(target: TModel, name: TKey, receiver: TModel) {
        if (detached) return Reflect.get(target, name);
        if (name === Detach) return () => (detached = true, target);

        if (typeof name === "string" && mutatingArrayMethods.includes(name)) {
            const arrayFunction = target[name] as Function;
            function proxyWrapped() {
                tracker.startTransaction();
                const arrayResult = arrayFunction.apply(receiver, arguments);
                tracker.commit();
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
    let sets = 0;
    function setOrdinary(target: TModel, name: TKey, newValue: any, receiver: TModel) {
        if (detached) return Reflect.set(target, name, newValue);

        if (typeof newValue === 'object' && !newValue[IsTracked]) {
            const handler = makeProxyHandler(newValue, tracker);
            newValue = new Proxy(newValue, handler);
        }

        const mutation: SingleMutation = name in target
            ? { type: "change", target, name, oldValue: model[name], newValue }
            : { type: "create", target, name,                        newValue };
        
        const initialSets = sets;
        const wasSet = Reflect.set(target, name, newValue, receiver);
        if (initialSets == sets) {
            // no other set operation completed while this one was being executed
            // if there *was* one or more, we want to record those instead of this
            tracker[RecordMutation](mutation);
        }
        ++sets;
        return wasSet;
    }

    function setArray(target: TModel, name: TKey, newValue: any, receiver: TModel) {
        if (detached) return Reflect.set(target, name, newValue);
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
                return Reflect.set(target, name, newValue);
            }
        }

        return setOrdinary(target, name, newValue, receiver);
    }

    function deleteProperty(target: TModel, name: TKey) {
        if (detached) return Reflect.deleteProperty(target, name);
        const mutation: DeleteProperty = { type: "delete", target, name, oldValue: model[name] };
        tracker[RecordMutation](mutation);
        return Reflect.deleteProperty(target, name);
    }

    let set = setOrdinary, get = getOrdinary;
    if (Array.isArray(model)) {
        set = setArray;
        if (tracker.tracksHistory()) get = getArrayTransactionShim;
    }
    
    if (isArguments(model)) throw Error('Tracking of exotic arguments objects not supported');

    // possibly unhandled exotic objects: integer-indexed, module namespaces, immutable prototypes

    return { get, set, deleteProperty };
}

export function isTracked(obj: object) {
    return typeof obj === "object" && !!(obj as any)[IsTracked];
}

export function getTracker(obj: object) {
    return (obj as any)[GetTracker];
}

export function untrack(obj: object){
    if (!isTracked(obj)) return obj;
    return (obj as any)[Detach]() as object;
}

// turn on change tracking
// returns a proxied model object, and tracker to control history
export function track<TModel extends object>(model: TModel, options?: TrackerOptions): [TModel, Tracker] {
    if (isTracked(model)) throw Error('Object already tracked');
    const tracker = new Tracker(options);
    const proxied = new Proxy(model, makeProxyHandler(model, tracker));
    return [proxied, tracker];
}