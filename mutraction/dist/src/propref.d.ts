import { Key } from "./types.js";
declare const _PropReference: {
    new <T>(object: object, prop: Key): {
        readonly object: any;
        readonly prop: Key;
        current: T;
    };
};
export type PropReference<T = any> = InstanceType<typeof _PropReference<T>>;
export declare function createPropRef<TObj extends object, TKey extends Key & keyof TObj>(object: TObj, prop: TKey): PropReference<TObj[TKey]>;
export {};
