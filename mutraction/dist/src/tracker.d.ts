import { RecordDependency, RecordMutation } from "./symbols.js";
import { Dependency } from "./dependency.js";
import type { Mutation, SingleMutation, Transaction } from "./types.js";
type Subscriber = (mutation: SingleMutation) => void;
declare const defaultTrackerOptions: {
    trackHistory: boolean;
    autoTransactionalize: boolean;
    deferNotifications: boolean;
};
export type TrackerOptions = Partial<typeof defaultTrackerOptions>;
export declare class Tracker {
    #private;
    options: Readonly<Required<TrackerOptions>>;
    constructor(options?: TrackerOptions);
    subscribe(callback: Subscriber): {
        dispose: () => boolean;
    };
    get tracksHistory(): boolean;
    get history(): ReadonlyArray<Readonly<Mutation>>;
    get generation(): number;
    startTransaction(name?: string): Transaction;
    commit(transaction?: Transaction): void;
    rollback(transaction?: Transaction): void;
    undo(): void;
    redo(): void;
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
