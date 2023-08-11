import { Key } from "./types.js";
export declare const SetGeneration: unique symbol;
export declare class PropReference<T = any> {
    #private;
    readonly object: any;
    readonly prop: Key;
    constructor(object: object, prop: Key);
    get current(): T;
    set current(newValue: T);
    /** generation of last change */
    get generation(): number;
    [SetGeneration](value: number): void;
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
