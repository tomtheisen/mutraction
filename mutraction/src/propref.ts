import { Key } from "./types.js";

export class PropReference<TObject extends object, TKey extends Key & keyof TObject> {
    readonly object: TObject;
    readonly prop: TKey;

    constructor(object: TObject, prop: TKey) {
        this.object = object;
        this.prop = prop;
    }

    get value(): TObject[TKey] { 
        return this.object[this.prop]; 
    }
    set value(newValue: TObject[TKey]) { 
        this.object[this.prop] = newValue; 
    }
}
