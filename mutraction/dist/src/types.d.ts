export type Key = string | symbol;
export type BaseSingleMutation = {
    target: object;
    name: Key;
};
export type CreateProperty = BaseSingleMutation & {
    type: "create";
    newValue: any;
};
export type DeleteProperty = BaseSingleMutation & {
    type: "delete";
    oldValue: any;
};
export type ChangeProperty = BaseSingleMutation & {
    type: "change";
    oldValue: any;
    newValue: any;
};
export type ArrayExtend = BaseSingleMutation & {
    type: "arrayextend";
    oldLength: number;
    newIndex: number;
    newValue: any;
};
export type ArrayShorten = BaseSingleMutation & {
    type: "arrayshorten";
    oldLength: number;
    newLength: number;
    removed: ReadonlyArray<any>;
};
export type SingleMutation = CreateProperty | DeleteProperty | ChangeProperty | ArrayExtend | ArrayShorten;
export type Transaction = {
    type: "transaction";
    transactionName?: string;
    parent?: Transaction;
    operations: Mutation[];
};
export type Mutation = SingleMutation | Transaction;
export type ReadonlyDeep<T extends object> = {
    readonly [K in keyof T]: T[K] extends object ? ReadonlyDeep<T[K]> : T[K];
};
