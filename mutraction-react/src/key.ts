let lastKey = 0;
const keyRegistry = new WeakMap<object, number>();

export function key(obj: object) {
    let key = keyRegistry.get(obj);
    if (key) return key;
    keyRegistry.set(obj, ++lastKey);
    return lastKey;
}
