import { Tracker } from "./tracker.js";
import { TrackerOf, RecordDependency, RecordMutation, ProxyOf, GetOriginal, AccessPath, ItemsSymbol } from "./symbols.js";
import type { ArrayExtend, ArrayShorten, DeleteProperty, Key, MapClear, MapDelete, SingleMutation } from "./types.js";
import { createOrRetrievePropRef } from "./propref.js";
import { isDebugMode } from "./debug.js";

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

/* get a new or existing tracker proxy if possible */
function maybeGetProxy<T>(value: T, tracker: Tracker): T | undefined {
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

function setAccessPath(obj: Object, parentPath: string | undefined, leafSegment: string | symbol) {
    const fullPath = parentPath ? parentPath + "." + String(leafSegment) : String(leafSegment);
    Object.assign(obj, {[AccessPath]: fullPath});
}

function assertSafeMapKey(key: any) {
    if (key && typeof key === "object" && !Object.isFrozen(key)) {
        throw Error("In order to apply tracking proxy, Map keys must be immutable or frozen.")
    }
}

export function prepareForTracking(value: any, tracker: Tracker) {
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
                value.add(tracker.track(e))
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

function getSetProxyHandler<T>(tracker: Tracker): ProxyHandler<Set<T>> {
    return {
        get(target: Set<T>, name: keyof Set<T> | symbol, receiver: Set<T>): any {
            if (!(target instanceof Set)) throw Error("Expected Set target in proxy.");
            const itemsPropRef = createOrRetrievePropRef(target, ItemsSymbol);
            switch (name) {
                case TrackerOf: return tracker;
                case GetOriginal: return target;
        
                case "size": 
                    tracker[RecordDependency](itemsPropRef);
                    return target.size;

                case "has":
                case "entries":
                case "keys":
                case "values":
                case "forEach":
                case Symbol.iterator:
                    return function setProxy() {
                        tracker[RecordDependency](itemsPropRef);
                        return (target as any)[name](...arguments);
                    };

                case "add": 
                    return function add(value: any) {
                        value = maybeGetProxy(value, tracker) ?? value;
                        setAccessPath(value, getAccessPath(target), "∃");

                        if (target.has(value)) return;
                        const result = target.add(value);
                        tracker[RecordMutation]({type: "setadd", name: ItemsSymbol, target, timestamp: new Date, newValue: value});
                        return result;
                    };

                case "delete":
                    return function delete$(value: any) {
                        value = maybeGetProxy(value, tracker) ?? value;
                        if (!target.has(value)) return;
                        const result = target.delete(value);
                        tracker[RecordMutation]({type: "setdelete", name: ItemsSymbol, target, timestamp: new Date, oldValue: value});
                        return result;
                    };

                case "clear":
                    return function clear() {
                        if (target.size === 0) return;
                        const oldValues = Array.from(target.values());
                        target.clear();
                        tracker[RecordMutation]({type: "setclear", name: ItemsSymbol, target, timestamp: new Date, oldValues });
                    };

                default: return Reflect.get(target, name, receiver);
            }
        },
    };
}

function getMapProxyHandler<K, V>(tracker: Tracker): ProxyHandler<Map<K, V>> {
    return {
        get(target: Map<K, V>, name: keyof Map<K, V> | symbol, receiver: Map<K, V>) {
            if (!(target instanceof Map)) throw Error("Expected Map target in proxy.");
            const itemsPropRef = createOrRetrievePropRef(target, ItemsSymbol);
            switch (name) {
                case TrackerOf: return tracker;
                case GetOriginal: return target;

                case "size":
                    tracker[RecordDependency](itemsPropRef);
                    return target.size;

                case "has":
                case "keys":
                case "values":
                case "entries":
                case Symbol.iterator:
                    return function mapProxy() {
                        tracker[RecordDependency](itemsPropRef);
                        return (target as any)[name](...arguments);
                    };

                case "get":
                    return function get(key: K) {
                        tracker[RecordDependency](itemsPropRef);
                        const result = target.get(key);
                        if (typeof result === "object" && result && isTracked(result)) {
                            setAccessPath(result, getAccessPath(target), `get(${ key })`);
                        }
                        return result;
                    }
                
                case "set":
                    return function set(key: K, val: V) {
                        assertSafeMapKey(key);

                        const isChange = target.has(key);
                        const oldValue = isChange && target.get(key);

                        const proxy = maybeGetProxy(val, tracker);
                        if (proxy) {
                            setAccessPath(proxy, getAccessPath(target), `get(${ key })`)
                        }

                        target.set(key, val = proxy ?? val);
                        const mutation: SingleMutation = isChange
                            ? { target, name: ItemsSymbol, timestamp: new Date, type: "mapchange", key, newValue: val, oldValue }
                            : { target, name: ItemsSymbol, timestamp: new Date, type: "mapcreate", key, newValue: val };
                        tracker[RecordMutation](mutation);

                        return receiver;
                    }

                case "delete":
                    return function delete$(key: K) {
                        const oldValue = target.get(key);

                        if (!target.delete(key)) return false;

                        const mutation: MapDelete = { target, name: ItemsSymbol, timestamp: new Date, type: "mapdelete", key, oldValue };
                        tracker[RecordMutation](mutation);

                        return true;
                    };

                case "clear":
                    return function clear() {
                        const oldEntries = Array.from(target.entries());

                        target.clear();

                        const mutation: MapClear = { target, name: ItemsSymbol, timestamp: new Date, type: "mapclear", oldEntries };
                        tracker[RecordMutation](mutation);
                    };

                default: return Reflect.get(target, name, receiver);
            }
        }
    };
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
        if (name === AccessPath) {
            return Reflect.set(target, AccessPath, newValue);
        }

        if (newValue && typeof newValue === "object" && isDebugMode) {
            setAccessPath(newValue, getAccessPath(target), name);
        }

        newValue = maybeGetProxy(newValue, tracker) ?? newValue;

        const mutation: SingleMutation = name in target
            ? { type: "change", target, name, oldValue: model[name], newValue, timestamp: new Date }
            : { type: "create", target, name,                        newValue, timestamp: new Date };
        
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
                    type: "arrayshorten", target, name, oldLength, newLength, removed, timestamp: new Date
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
                    type: "arrayextend", target, name, oldLength: target.length, newIndex: index, newValue, timestamp: new Date
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
        const mutation: DeleteProperty = { type: "delete", target, name, oldValue: model[name], timestamp: new Date };
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
