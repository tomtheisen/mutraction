import { RecordDependency, RecordMutation } from "./symbols.js";
import { Dependency } from "./dependency.js";
import type { Mutation, SingleMutation } from "./types.js";
type Subscriber = (mutation: SingleMutation) => void;
export declare class Tracker {
    #private;
    constructor(callback?: Subscriber);
    subscribe(callback: Subscriber): {
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