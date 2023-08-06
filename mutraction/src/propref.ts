import { Key } from "./types.js";

const _PropReference = class PropReference<T> {
    readonly object: any;
    readonly prop: Key;

    constructor(object: object, prop: Key) {
        this.object = object;
        this.prop = prop;
    }

    get current(): T { 
        return this.object[this.prop]; 
    }
    set current(newValue: T) {
        this.object[this.prop] = newValue; 
    }
}

export type PropReference<T = any> = InstanceType<typeof _PropReference<T>>;

export function createPropRef<TObj extends object, TKey extends Key & keyof TObj>(object: TObj, prop: TKey): PropReference<TObj[TKey]> {
    return new _PropReference<TObj[TKey]>(object, prop);
};
