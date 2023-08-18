import { Key, Subscription } from "./types.js";
import { ProxyOf } from "./symbols.js";
import { isTracked } from "./proxy.js";

// const stats = { created: 0, collected: 0 };
// const registry = new FinalizationRegistry(pr => {
//     stats.collected++;
//     console.log(stats);
// });



export class PropReference<T = any> {
    readonly object: any;
    readonly prop: Key;
    #subscribers: Set<() => void> = new Set;
    #notifying: boolean = false;

    constructor(object: object, prop: Key) {
        if (!isTracked(object) && (object as any)[ProxyOf]) {
            object = (object as any)[ProxyOf];
        }
        this.object = object;
        this.prop = prop;

        // registry.register(this, {});
        // stats.created++;
        // console.log(stats);
    }

    subscribe(callback: () => void): Subscription {
        this.#subscribers.add(callback);
        return { dispose: this.#subscribers.delete.bind(this.#subscribers, callback) };
    }

    notifySubscribers() {
        if (this.#notifying) 
            console.warn(`Re-entrant property subscription for '${ String(this.prop) }'`);
        this.#notifying = true;
        for (const callback of [...this.#subscribers]) callback();
        this.#notifying = false;
    }

    get current(): T {
        return this.object[this.prop]; 
    }
    set current(newValue: T) {
        this.object[this.prop] = newValue; 
    }
}

// export the type without the constuctor
// export type PropReference<T = any> = InstanceType<typeof _PropReference<T>>;

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
    if (!result) objectPropRefs.set(prop, result = new PropReference(object, prop));

    return result;
};
