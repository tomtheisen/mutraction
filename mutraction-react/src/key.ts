let lastKey = 0;
const keyRegistry = new WeakMap<object, number>();

// Gets a unique key for an object.
// Normally, an object's identity can serve as its own key.
// This mainly exists to satisfy the rules of react's key attribute.
// https://github.com/facebook/react/issues/19851
export function key(obj: object) {
    // This whole function ought to be the identity function.
    // But reacts types say that `key` is `string | number`.
    // You can't even use a bigint or symbol.
    if (obj == null) return -1;
    let key = keyRegistry.get(obj);
    if (key) return key;
    keyRegistry.set(obj, ++lastKey);
    return lastKey;
}
