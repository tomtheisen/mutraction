import { Key, Subscription } from "./types.js";
import { ProxyOf } from "./symbols.js";
import { isTracked } from "./proxy.js";
import { DependencyList } from "./dependency.js";
import { isDebugMode } from "./debug.js";

let propRefsCreated = 0;
let propRefTotalSubscribers = 0;

type PropRefInfo = {
    created: number;
    subscribers: number;
};
let notifyDebug: ((info: PropRefInfo) => void) | undefined;
export function setPropRefDebugCallback(notify: (info: PropRefInfo) => void) {
    notifyDebug = notify;
}
function doNotify() {
    notifyDebug?.({
        created: propRefsCreated,
        subscribers: propRefTotalSubscribers,
    });
}

/**
 * Represents a particular named property on a particular object.
 * Similar to a property descriptor.
 */
export class PropReference<T = any> {
    readonly object: any;
    readonly prop: Key;
    #subscribers: Set<DependencyList> = new Set;
    #notifying: boolean = false;

    get subscribers(): ReadonlySet<DependencyList> {
        return this.#subscribers;
    }

    constructor(object: object, prop: Key) {
        if (!isTracked(object) && (object as any)[ProxyOf]) {
            object = (object as any)[ProxyOf];
        }
        this.object = object;
        this.prop = prop;
    }

    subscribe(dependencyList: DependencyList): Subscription {
        this.#subscribers.add(dependencyList);
        if (isDebugMode) {
            ++propRefTotalSubscribers;
            doNotify();
        }

        return { 
            dispose: () => {
                this.#subscribers.delete(dependencyList);
                if (isDebugMode) {
                    --propRefTotalSubscribers;
                    doNotify();
                }
            } 
        };
    }

    notifySubscribers() {
        if (this.#notifying) 
            console.warn(`Re-entrant property subscription for '${ String(this.prop) }'`);

        // we only want to notify subscribers that existed at the beginning
        // of the notification cycle to prevent instability and infinite cycles
        const subscriberSnapshot = Array.from(this.#subscribers);

        this.#notifying = true;
        for (const dep of subscriberSnapshot) dep.notifySubscribers(this);
        this.#notifying = false;
    }

    get current(): T {
        return this.object[this.prop]; 
    }
    set current(newValue: T) {
        this.object[this.prop] = newValue; 
    }
}

// cache of existing PropReferences
// factory method always returns existing instance if possible
const propRefRegistry: WeakMap<object, Map<Key, PropReference>> = new WeakMap;

/**
 * Gets a PropReference for an object property.  
 * This allows getting and setting a particular property on a particular object.
 * @param object is the target object
 * @param prop is the property name
 * @returns PropReference
 */
export function createOrRetrievePropRef(object: object, key: Key): PropReference<unknown>;
export function createOrRetrievePropRef<TObj extends object, TKey extends Key & keyof TObj>(object: TObj, prop: TKey): PropReference<TObj[TKey]>;
export function createOrRetrievePropRef(object: object, prop: Key) {
    let objectPropRefs = propRefRegistry.get(object);
    if (!objectPropRefs) propRefRegistry.set(object, objectPropRefs = new Map);

    let result = objectPropRefs.get(prop);
    if (!result) {
        objectPropRefs.set(prop, result = new PropReference(object, prop));
        if (isDebugMode) {
            ++propRefsCreated;
            doNotify();
        }
    }

    return result;
};
