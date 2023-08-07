import { RecordDependency, RecordMutation } from "./symbols.js";
import { Dependency } from "./dependency.js";
import type { Key, Mutation, SingleMutation, Transaction } from "./types.js";
import { PropReference } from "./propref.js";
type Subscriber = (mutation: SingleMutation | undefined) => void;
declare const defaultTrackerOptions: {
    trackHistory: boolean;
    autoTransactionalize: boolean;
    deferNotifications: boolean;
    compactOnCommit: boolean;
};
export type TrackerOptions = Partial<typeof defaultTrackerOptions>;
export declare class Tracker {
    #private;
    options: Readonly<Required<TrackerOptions>>;
    constructor(options?: TrackerOptions);
    subscribe(callback: Subscriber): {
        dispose: () => boolean;
    };
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
    [RecordDependency](target: object, name: Key): void;
    /**
     * Gets a property reference that refers to a particular property on a particular object.
     * It can get or set the target property value using the `current` property, so it's a valid React ref.
     * If there's an existing PropRef matching the arguments, it will be returned.
     * A new one will be created only if necessary.
     * @param propGetter parameter-less function that gets the target property value e.g. `() => model.settings.logFile`
     * @returns PropReference for an object property
     */
    getPropRef<T>(propGetter: () => T): PropReference<T>;
}
export {};
