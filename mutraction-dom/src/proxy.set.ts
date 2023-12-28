import { Tracker } from "./tracker.js";
import { TrackerOf, RecordDependency, RecordMutation, GetOriginal, ItemsSymbol } from "./symbols.js";
import { createOrRetrievePropRef } from "./propref.js";
import { maybeGetProxy, setAccessPath, getAccessPath } from "./proxy.js";

export function getSetProxyHandler<T>(tracker: Tracker): ProxyHandler<Set<T>> {
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
                        tracker[RecordMutation]({ type: "setadd", name: ItemsSymbol, target, newValue: value });
                        return result;
                    };

                case "delete":
                    return function delete$(value: any) {
                        value = maybeGetProxy(value, tracker) ?? value;
                        if (!target.has(value)) return;
                        const result = target.delete(value);
                        tracker[RecordMutation]({ type: "setdelete", name: ItemsSymbol, target, oldValue: value });
                        return result;
                    };

                case "clear":
                    return function clear() {
                        if (target.size === 0) return;
                        const oldValues = Array.from(target.values());
                        target.clear();
                        tracker[RecordMutation]({ type: "setclear", name: ItemsSymbol, target, oldValues });
                    };

                default: return Reflect.get(target, name, receiver);
            }
        },
    };
}
