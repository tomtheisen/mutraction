import { RecordDependency, RecordMutation } from "./symbols.js";
import { Dependency } from "./dependency.js";
import type { Mutation, SingleMutation, Transaction } from "./types.js";
type Subscriber = (mutation: SingleMutation) => void;
export type TrackerOptions = {
    trackHistory?: boolean;
    autoTransactionalize?: boolean;
};
export declare class Tracker {
    #private;
    options: Readonly<Required<TrackerOptions>>;
    constructor(options?: TrackerOptions);
    subscribe(callback: Subscriber): {
        dispose: () => boolean;
    };
    ensureHistory(): Transaction;
    tracksHistory(): boolean;
    get history(): ReadonlyArray<Readonly<Mutation>>;
    get generation(): number;
    private advanceGeneration;
    startTransaction(name?: string): void;
    commit(): void;
    rollback(): void;
    undo(): void;
    private undoOperation;
    redo(): void;
    private redoOperation;
    clearRedos(): void;
    clearHistory(): void;
    [RecordMutation](mutation: SingleMutation): void;
    getLastChangeGeneration(target: object): any;
    setLastChangeGeneration(target: object): void;
    startDependencyTrack(): Dependency;
    endDependencyTrack(dep: Dependency): Dependency;
    [RecordDependency](target: object): void;
}
export {};
//# sourceMappingURL=tracker.d.ts.map