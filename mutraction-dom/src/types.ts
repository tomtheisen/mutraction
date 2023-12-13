import { PropReference } from "./propref.js";

export type Key = string | symbol;

export type Transaction = {
    type: "transaction", 
    transactionName?: string, 
    depth: number,
    changes: Set<PropReference>,
};

export type ReadonlyDeep<T extends object> = {
    readonly [K in keyof T]:
        T[K] extends Array<infer E> ? ReadonlyArray<E>
        : T[K] extends Set<infer E> ? ReadonlySet<E>
        : T[K] extends Map<infer D, infer E> ? ReadonlyMap<D, E>
        : T[K] extends Function ? T[K]
        : T[K] extends object ? ReadonlyDeep<T[K]>
        : T[K];
}

export type Subscription = {
    dispose(): void;
}

export function isNodeOptions(arg: unknown): arg is NodeOptions {
    return arg != null && typeof arg === "object" && "node" in arg && arg.node instanceof Node;
}

export type NodeOptions = {
    node: Node;
    cleanup?: () => void;
};

type NodeModifierAttribute = {
    readonly $muType: "attribute";
    name: string;
    value: string;
};

// applied with mu:apply
// when more concrete modifiers are added, this will become a union
export type NodeModifier = NodeModifierAttribute;
