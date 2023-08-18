export function memoize<T>(getter: () => T): () => T {
    let isResolved = false;
    let value: T | undefined = undefined;

    function resolveLazy(): T {
        return isResolved ? value! : (isResolved = true, value = getter());
    }

    return resolveLazy;
}
