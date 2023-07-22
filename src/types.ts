export type Key = string | symbol;
export type BaseSingleMutation = { target: object, path: ReadonlyArray<Key>, name: Key };
export type CreateProperty = BaseSingleMutation & { type: "create", newValue: any };
export type DeleteProperty = BaseSingleMutation & { type: "delete", oldValue: any };
export type ChangeProperty = BaseSingleMutation & { type: "change", oldValue: any, newValue: any };

// adds a single element OOB to an array
export type ArrayExtend = BaseSingleMutation & { type: "arrayextend", oldLength: number, newIndex: number, newValue: any };

export type SingleMutation = CreateProperty | DeleteProperty | ChangeProperty | ArrayExtend;
export type Transaction = {type: "transaction", parent?: Transaction, operations: Mutation[]};
export type Mutation = SingleMutation | Transaction;

