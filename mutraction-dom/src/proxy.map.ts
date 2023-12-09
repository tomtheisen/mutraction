import { Tracker } from "./tracker.js";
import { TrackerOf, RecordDependency, RecordMutation, GetOriginal, ItemsSymbol } from "./symbols.js";
import { createOrRetrievePropRef } from "./propref.js";
import { isTracked, setAccessPath, getAccessPath, maybeGetProxy } from "./proxy.js";

export function getMapProxyHandler<K, V>(tracker: Tracker): ProxyHandler<Map<K, V>> {
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
                            setAccessPath(result, getAccessPath(target), `get(${key})`);
                        }
                        return result;
                    };

                case "set":
                    return function set(key: K, val: V) {
                        assertSafeMapKey(key);

                        const proxy = maybeGetProxy(val, tracker);
                        if (proxy) setAccessPath(proxy, getAccessPath(target), `get(${key})`);

                        target.set(key, val = proxy ?? val);
                        tracker[RecordMutation](target, ItemsSymbol);
                        return receiver;
                    };

                case "delete":
                    return function delete$(key: K) {
                        if (!target.delete(key)) return false;
                        tracker[RecordMutation](target, ItemsSymbol);
                        return true;
                    };

                case "clear":
                    return function clear() {
                        target.clear();
                        tracker[RecordMutation](target, ItemsSymbol);
                    };

                default: return Reflect.get(target, name, receiver);
            }
        }
    };
}

export function assertSafeMapKey(key: any) {
    if (key && typeof key === "object" && !Object.isFrozen(key)) {
        throw Error("In order to apply tracking proxy, Map keys must be immutable or frozen.");
    }
}

