import { Key } from "./types.js";
import { ProxyOf } from "./symbols.js";
import { isTracked } from "./proxy.js";

export const SetGeneration = Symbol("SetGeneration");

export class PropReference<T = any> {
    readonly object: any;
    readonly prop: Key;

    constructor(object: object, prop: Key) {
        if (!isTracked(object) && (object as any)[ProxyOf]) {
            object = (object as any)[ProxyOf];
        }
        this.object = object;
        this.prop = prop;
    }

    get current(): T {
        return this.object[this.prop]; 
    }
    set current(newValue: T) {
        this.object[this.prop] = newValue; 
    }

    #generation = 0;
    /** generation of last change */
    get generation() { return this.#generation; }

    [SetGeneration](value: number) {
        this.#generation = value;
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
