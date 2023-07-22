declare module "src/symbols" {
    export const RecordMutation: unique symbol;
    export const IsTracked: unique symbol;
    export const GetTracker: unique symbol;
    export const Detach: unique symbol;
    export const RecordDependency: unique symbol;
    export const LastChangeGeneration: unique symbol;
}
declare module "src/dependency" {
    import { Tracker } from "src/tracker";
    export class Dependency {
        #private;
        trackedObjects: Set<object>;
        constructor(tracker: Tracker);
        addDependency(target: object): void;
        getLatestChangeGeneration(): number;
    }
}
declare module "src/types" {
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
        parent?: Transaction;
        operations: Mutation[];
    };
    export type Mutation = SingleMutation | Transaction;
}
declare module "src/tracker" {
    import { RecordDependency, RecordMutation } from "src/symbols";
    import { Dependency } from "src/dependency";
    import type { Mutation, SingleMutation } from "src/types";
    export class Tracker {
        #private;
        constructor(callback?: (mutation: SingleMutation) => void);
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
}
declare module "src/proxy" {
    import { Tracker } from "src/tracker";
    import type { SingleMutation } from "src/types";
    export function isTracked(obj: object): any;
    export function getTracker(obj: object): any;
    export function untrack(obj: object): object;
    export function track<TModel extends object>(model: TModel, callback?: (mutation: SingleMutation) => void): [TModel, Tracker];
}
declare module "index" {
    export { track, untrack, isTracked, getTracker } from "src/proxy";
}
declare module "scratch" { }
declare module "tests/basic" { }
declare module "tests/dependencies" { }
