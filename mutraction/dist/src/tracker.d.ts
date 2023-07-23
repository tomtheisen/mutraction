import { RecordDependency, RecordMutation } from "./symbols";
import { Dependency } from "./dependency";
import type { Mutation, SingleMutation } from "./types";
type Subscription = (mutation: SingleMutation) => void;
export declare class Tracker {
    #private;
    constructor(callback?: Subscription);
    subscribe(callback: Subscription): {
        dispose: () => boolean;
    };
    get history(): ReadonlyArray<Readonly<Mutation>>;
    get generation(): number;
    private advanceGeneration;
    startTransaction(): void;
    commit(): void;
    rollback(): void;
    undo(): void;
    private undoOperation;
    redo(): void;
    private redoOperation;
    clearRedos(): void;
    [RecordMutation](mutation: SingleMutation): void;
    getLastChangeGeneration(target: object): any;
    setLastChangeGeneration(target: object): void;
    startDependencyTrack(): Dependency;
    endDependencyTrack(dep: Dependency): Dependency;
    [RecordDependency](target: object): void;
}
export {};
//# sourceMappingURL=tracker.d.ts.map