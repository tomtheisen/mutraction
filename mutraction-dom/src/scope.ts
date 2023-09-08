type DocumentScopeType<T> = Readonly<{
    name: string;
    typeBrand?: T; // not intended to be set
}>;

type DocumentScope<T> = Readonly<{
    type: DocumentScopeType<T>;
    value: T;
    parent?: DocumentScope<unknown>;
}>;

function createScopeType<T>(name: string): DocumentScopeType<T> {
    return Object.freeze({ name });
}

export const ScopeTypes = Object.freeze({
    errorBoundary: createScopeType<(err: unknown) => void>("error boundary"),
});

let currentScope: DocumentScope<unknown> | undefined;

export function enterScope<T>(type: DocumentScopeType<T>, value: T) {
    currentScope = { type, value, parent: currentScope };
}

export function exitScope<T = unknown>(type: DocumentScopeType<T>) {
    if (!currentScope) 
        throw Error("No active scope to exit.");

    if (!Object.is(type, currentScope?.type))
        throw Error(`Tried to exit scope: ${ type.name } instead of ${ currentScope.type.name }`);

    currentScope = currentScope?.parent;
}

function scopeIsOfType<T>(scope: DocumentScope<unknown>, type: DocumentScopeType<T>): scope is DocumentScope<T> {
    return Object.is(scope.type, type);
}

export function getScopedValue<T>(type: DocumentScopeType<T>): T | undefined {
    for (let s = currentScope; s; s = s.parent) {
        if (scopeIsOfType<T>(s, type)) return s.value;
    }
}
