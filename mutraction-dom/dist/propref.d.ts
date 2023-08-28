import { Key, Subscription } from "./types.js";
import { DependencyList } from "./dependency.js";
export declare class PropReference<T = any> {
    #private;
    readonly object: any;
    readonly prop: Key;
    constructor(object: object, prop: Key);
    subscribe(dependencyList: DependencyList): Subscription;
    notifySubscribers(): void;
    get current(): T;
    set current(newValue: T);
}
/**
 * Gets a PropReference for an object property.
 * This allows getting and setting a particular property on a particular object.
 * @param object is the target object
 * @param prop is the property name
 * @returns PropReference
 */
export declare function createOrRetrievePropRef(object: object, key: Key): PropReference<unknown>;
export declare function createOrRetrievePropRef<TObj extends object, TKey extends Key & keyof TObj>(object: TObj, prop: TKey): PropReference<TObj[TKey]>;
