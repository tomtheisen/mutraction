export const mutractionDomModule = `
declare module 'mutraction-dom' {
    // export { element, child, ForEach, ForEachPersist } from './runtime.js';
    export function ForEach<TIn, TOut extends Node>(array: TIn[], map: (item: TIn, index: number, array: T[]) => TOut): Node;
    export function ForEachPersist<TIn extends object>(array: TIn[], map: (e: TIn) => Node): Node;

    // export { choose } from './choose.js';
    // export { isTracked } from './proxy.js';
    export function isTracked(obj: object): boolean;    

    // export { Tracker, TrackerOptions, defaultTracker, track } from './tracker.js';
    export type TrackerOptions = {
        trackHistory?: boolean;
        autoTransactionalize?: boolean;
        deferNotifications?: boolean;
        compactOnCommit?: boolean;
    };
    type ReadonlyDeep<T extends object> = {
        readonly [K in keyof T]: T[K] extends Array<infer E> ? ReadonlyArray<E> : T[K] extends Set<infer E> ? ReadonlySet<E> : T[K] extends Map<infer D, infer E> ? ReadonlyMap<D, E> : T[K] extends Function ? T[K] : T[K] extends object ? ReadonlyDeep<T[K]> : T[K];
    };
    type Key = string | symbol;
    type BaseSingleMutation = {
        target: object;
        name: Key;
    };
    type CreateProperty = BaseSingleMutation & {
        type: "create";
        newValue: any;
    };
    type DeleteProperty = BaseSingleMutation & {
        type: "delete";
        oldValue: any;
    };
    type ChangeProperty = BaseSingleMutation & {
        type: "change";
        oldValue: any;
        newValue: any;
    };
    type ArrayExtend = BaseSingleMutation & {
        type: "arrayextend";
        oldLength: number;
        newIndex: number;
        newValue: any;
    };
    type ArrayShorten = BaseSingleMutation & {
        type: "arrayshorten";
        oldLength: number;
        newLength: number;
        removed: ReadonlyArray<any>;
    };
    type SingleMutation = CreateProperty | DeleteProperty | ChangeProperty | ArrayExtend | ArrayShorten;
    type Transaction = {
        type: "transaction";
        transactionName?: string;
        parent?: Transaction;
        operations: Mutation[];
    };
    type Mutation = SingleMutation | Transaction;    
    type Subscriber = (mutation: SingleMutation | undefined) => void;

    export type Subscription = {
        dispose(): void;
    };

    export class Tracker {
        options: Readonly<Required<TrackerOptions>>;
        constructor(options?: TrackerOptions);
        track<TModel extends object>(model: TModel): TModel;
        trackAsReadonlyDeep<TModel extends object>(model: TModel): ReadonlyDeep<TModel>;
        subscribe(callback: Subscriber): {
            dispose: () => boolean;
        };
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
        startDependencyTrack(): DependencyList;
        endDependencyTrack(dep: DependencyList): DependencyList;
        /**
         * Gets a property reference that refers to a particular property on a particular object.
         * It can get or set the target property value using the 'current' property, so it's a valid React ref.
         * If there's an existing PropRef matching the arguments, it will be returned.
         * A new one will be created only if necessary.
         * @param propGetter parameter-less function that gets the target property value e.g. '() => model.settings.logFile'
         * @returns PropReference for an object property
         */
        getPropRef<T>(propGetter: () => T): PropReference<T>;
        getPropRefTolerant<T>(propGetter: () => T): PropReference<T> | undefined;
    }
    
    export const defaultTracker: Tracker;
    export function track<TModel extends object>(model: TModel): TModel;

    // export { PropReference, createOrRetrievePropRef } from './propref.js';
    class PropReference<T = any> {
        #private;
        readonly object: any;
        readonly prop: Key;
        constructor(object: object, prop: Key);
        subscribe(callback: () => void): Subscription;
        notifySubscribers(): void;
        get current(): T;
        set current(newValue: T);
    }    

    /**
     * Gets a PropReference for an object property.
     * This allows getting and setting a particular property on a particular object.
     * @param object is the target object
     * @param prop is the property name
     * @returns PropReference
     */
    export function createOrRetrievePropRef(object: object, key: Key): PropReference<unknown>;
    export function createOrRetrievePropRef<TObj extends object, TKey extends Key & keyof TObj>(object: TObj, prop: TKey): PropReference<TObj[TKey]>;
    
    // export { effect } from './effect.js';
    type EffectOptions = {
        suppressUntrackedWarning?: boolean;
        tracker?: Tracker;
    };    
    export function effect(sideEffect: (dep: DependencyList) => (void | (() => void)), options?: EffectOptions): Subscription;

    // export { DependencyList } from './dependency.js';
    class DependencyList {
        active: boolean;
        constructor(tracker: Tracker);
        get trackedProperties(): ReadonlyArray<PropReference>;
        addDependency(propRef: PropReference): void;
        subscribe(callback: () => void): Subscription;
        notifySubscribers(): void;
        endDependencyTrack(): void;
        /** Indicates that this dependency list is dependent on *all* tracked changes */
        trackAllChanges(): void;
        untrackAll(): void;
    }

    // export { Router } from './router.js';
    type Route = {
        pattern: RegExp | string;
        element: Node | ((match: RegExpExecArray) => Node);
        suppressScroll?: boolean;
    } | {
        element: Node | (() => Node);
        suppressScroll?: boolean;
    };
    export function Router(...routes: Route[]): Node;    

    // export { PromiseLoader } from './promiseLoader.js';
    export function PromiseLoader(promise: Promise<Node>, spinner?: Node): DocumentFragment;
}
`;

export const mutractionDomPackageJson = `
{
  "name": "mutraction-dom",
  "type": "module",
  "exports": {
    ".": "./index.js",
    "./jsx-runtime": {
      "types": "./jsx.d.ts"
    },
  }
}
`;

export const jsxDTS = `
// declare module 'mutraction-dom/jsx-types' {
    type MutractionElement<ElementType extends keyof HTMLElementTagNameMap> = {
        [Prop in keyof HTMLElementTagNameMap[ElementType]]?:
            Prop extends "classList" ? Record<string, boolean> :
            Prop extends "style" ? Partial<CSSStyleDeclaration> :
            HTMLElementTagNameMap[ElementType][Prop];
    }
    & {
        "mu:if"?: boolean;
        "mu:else"?: boolean;
        "mu:syncEvent"?: (keyof HTMLElementEventMap) | string;
    };

    export namespace JSX {
        export type Element = Node;

        export type ElementAttributesProperty = never;

        export type IntrinsicElements = {
            [key in keyof HTMLElementTagNameMap]: MutractionElement<key>;
        };
    }
// }
`;