type Cloneable = string | number | bigint | symbol | boolean | Cloneable[] | { [key: string]: Cloneable };

/** 
 * `untrackedClone` creates a deep clone of an object which is not tracked or proxied.
 * The main case where this is useful is doing an intensive computation which involves
 * making a lot of mutations.  The proxy layer and DOM synchronization of tracked objects
 * have a cost.  In some cases, it's faster to do the computations in an untracked
 * version of the object, and then put it back into a tracked model when the 
 * expensive computation is complete.
 * 
 * @ param obj is the object to clone.  It cannot be an instance of a class.
 * @ param maxDepth is the maximum depth of recursion.  The default is 10.
 * Reference cycles are not supported
 * @ example
 * const localPiece = untrackedClone(model.piece);
 * expensiveModifications(localPiece);
 * model.piece = localPiece;
 */
export function untrackedClone<T extends Cloneable & object>(obj: T, maxDepth = 10): T {
    return untrackedCloneImpl(obj, maxDepth);
}

function untrackedCloneImpl<T extends Cloneable>(obj: T, maxDepth: number): T {
    if (maxDepth < 0)
        throw Error("Maximum depth exceeded.  Maybe there's a reference cycle?");
    if (typeof obj !== "object") return obj; // primitive values don't need cloning
    if (Array.isArray(obj)) {
        const result = obj.map(e => untrackedCloneImpl(e, maxDepth - 1));
        return result as any;
    }
    if (obj.constructor && obj.constructor !== Object)
        throw Error("Can't clone objects with a prototype chain or instances of classes");
    return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, untrackedCloneImpl(v, maxDepth - 1)])
    ) as any;
}
