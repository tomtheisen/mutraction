import { Tracker } from "./tracker";
import { GetTracker, IsTracked, RecordMutation } from "./symbols";
import type { ArrayExtend, DeleteProperty, Key, SingleMutation } from "./types";

function isArrayIndex(name: string | symbol): name is string {
    if (typeof name !== "string") return false;
    if (!/^\d{1,10}$/.test(name)) return false;
    return parseInt(name, 10) < 0x7fff_ffff;
}

function makeProxyHandler<TModel extends object>(
    model: TModel,
    tracker: Tracker,
    path: ReadonlyArray<Key> = []
) : ProxyHandler<TModel> {
    type TKey = (keyof TModel) & Key;

    function get(target: TModel, name: TKey) {
        if (name === IsTracked) return true;
        if (name === GetTracker) return tracker;
        let result = target[name] as any;
        if (typeof result !== 'object' || result[IsTracked]) return result;
        const handler = makeProxyHandler(result, tracker, path.concat(name));
        return target[name] = new Proxy(result, handler);
    }

    function setOrdinary(target: TModel, name: TKey, newValue: any) {
        if (typeof newValue === 'object' && !newValue[IsTracked]) {
            const handler = makeProxyHandler(newValue, tracker, path.concat(name));
            newValue = new Proxy(newValue, handler);
        }
        const mutation: SingleMutation = name in target
            ? { type: "change", target, path, name, oldValue: model[name], newValue }
            : { type: "create", target, path, name, newValue };
        tracker[RecordMutation](mutation);
        return Reflect.set(target, name, newValue);
    }

    function setArray(target: TModel, name: TKey, newValue: any) {
        if (!Array.isArray(target)) {
            throw 'This object used to be an array.  Expected an array.';
        }
        if (name === "length") {
            //throw 'no length changes';
        }
        
        if (isArrayIndex(name)) {
            const index = parseInt(name, 10);
            if (index >= target.length) {
                // assignment to array index will lengthen array    
                const extension: ArrayExtend = { 
                    type: "arrayextend", target, name, path, 
                    oldLength: target.length,
                    newIndex: index,
                    newValue
                };
                tracker[RecordMutation](extension);
                return Reflect.set(target, name, newValue);
            }
        }

        return setOrdinary(target, name, newValue);
    }

    function deleteProperty(target: TModel, name: TKey) {
        const mutation: DeleteProperty = { type: "delete", target, path, name, oldValue: model[name] };
        tracker[RecordMutation](mutation);
        return Reflect.deleteProperty(target, name);
    }

    let set = setOrdinary;
    if (Array.isArray(model)) set = setArray;

    return { get, set, deleteProperty };
}

export function isTracked(obj: object) {
    return typeof obj === "object" && (obj as any)[IsTracked];
}

export function getTracker(obj: object) {
    return (obj as any)[GetTracker];
}

// turn on change tracking
// returns a proxied model object, and tracker to control history
export function track<TModel extends object>(model: TModel, callback?: (mutation: SingleMutation) => void): [TModel, Tracker] {
    const tracker = new Tracker(callback);
    const proxied = new Proxy(model, makeProxyHandler(model, tracker));
    return [proxied, tracker];
}
