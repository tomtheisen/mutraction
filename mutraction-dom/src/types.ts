import { PropReference } from "./propref.js";

export type Key = string | symbol;
export type BaseSingleMutation = { target: object, name: Key };
export type CreateProperty = BaseSingleMutation & { type: "create", newValue: any };
export type DeleteProperty = BaseSingleMutation & { type: "delete", oldValue: any };
export type ChangeProperty = BaseSingleMutation & { type: "change", oldValue: any, newValue: any };

// adds a single element OOB to an array
export type ArrayExtend = BaseSingleMutation & { type: "arrayextend", oldLength: number, newIndex: number, newValue: any };

// shorten an array using the length setter
export type ArrayShorten = BaseSingleMutation & { type: "arrayshorten", oldLength: number, newLength: number, removed: ReadonlyArray<any> };

export type SingleMutation = CreateProperty | DeleteProperty | ChangeProperty | ArrayExtend | ArrayShorten;

export type Transaction = {
    type: "transaction", 
    transactionName?: string, 
    parent?: Transaction, 
    operations: Mutation[],
    dependencies: Set<PropReference>;
};
export type Mutation = SingleMutation | Transaction;

export type ReadonlyDeep<T extends object> = {
    readonly [K in keyof T]:
        T[K] extends Array<infer E> ? ReadonlyArray<E>
        : T[K] extends Set<infer E> ? ReadonlySet<E>
        : T[K] extends Map<infer D, infer E> ? ReadonlyMap<D, E>
        : T[K] extends Function ? T[K]
        : T[K] extends object ? ReadonlyDeep<T[K]>
        : T[K]
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
