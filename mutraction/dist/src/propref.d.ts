import { Key } from "./types.js";
declare const _PropReference: {
    new <T>(object: object, prop: Key): {
        readonly object: any;
        readonly prop: Key;
        current: T;
    };
};
export type PropReference<T = any> = InstanceType<typeof _PropReference<T>>;
/**
 * Gets a PropReference for an object property.
 * This allows getting and setting a particular property on a particular object.
 * @param object is the target object
 * @param prop is the property name
 * @returns PropReference
 */
export declare function createOrRetrievePropRef<TObj extends object, TKey extends Key & keyof TObj>(object: TObj, prop: TKey): PropReference<TObj[TKey]>;
export {};
