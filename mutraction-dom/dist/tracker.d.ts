import { RecordDependency, RecordMutation } from "./symbols.js";
import { DependencyList } from "./dependency.js";
import type { Mutation, ReadonlyDeep, SingleMutation, Transaction } from "./types.js";
import { PropReference } from "./propref.js";
declare const defaultTrackerOptions: {
    trackHistory: boolean;
    autoTransactionalize: boolean;
    compactOnCommit: boolean;
};
export type TrackerOptions = Partial<typeof defaultTrackerOptions>;
export declare class Tracker {
    #private;
    options: Readonly<Required<TrackerOptions>>;
    constructor(options?: TrackerOptions);
    track<TModel extends object>(model: TModel): TModel;
    trackAsReadonlyDeep<TModel extends object>(model: TModel): ReadonlyDeep<TModel>;
    get history(): ReadonlyArray<Readonly<Mutation>>;
    /** add another transaction to the stack  */
    startTransaction(name?: string): Transaction;
    /** resolve and close the most recent transaction
      * throws if no transactions are active
      */
    commit(transaction?: Transaction): void;
    /** undo all operations done since the beginning of the most recent trasaction
     * remove it from the transaction stack
     * if no transactions are active, undo all mutations
     */
    rollback(transaction?: Transaction): void;
    /** undo last mutation or transaction and push into the redo stack  */
    undo(): void;
    /** repeat last undone mutation  */
    redo(): void;
    /** clear the redo stack */
    clearRedos(): void;
    clearHistory(): void;
    /** record a mutation, if you have the secret key  */
    [RecordMutation](mutation: SingleMutation): void;
    startDependencyTrack(): DependencyList;
    endDependencyTrack(dep: DependencyList): DependencyList;
    [RecordDependency](propRef: PropReference): void;
    /**
     * Gets a property reference that refers to a particular property on a particular object.
     * It can get or set the target property value using the `current` property, so it's a valid React ref.
     * If there's an existing PropRef matching the arguments, it will be returned.
     * A new one will be created only if necessary.
     * @param propGetter parameter-less function that gets the target property value e.g. `() => model.settings.logFile`
     * @returns PropReference for an object property
     */
    getPropRef<T>(propGetter: () => T): PropReference<T>;
    getPropRefTolerant<T>(propGetter: () => T): PropReference<T> | undefined;
}
export declare const defaultTracker: Tracker;
export declare function track<TModel extends object>(model: TModel): TModel;
export {};
