// Generated by dts-bundle-generator v8.0.1

export declare function ForEach<TIn, TOut extends Node>(array: TIn[], map: (item: TIn, index: number, array: TIn[]) => TOut): Node;
export declare function ForEachPersist<TIn extends object>(array: TIn[], map: (e: TIn) => Node): Node;
type ElementStringProps<E extends keyof HTMLElementTagNameMap> = {
	[K in keyof HTMLElementTagNameMap[E]]: HTMLElementTagNameMap[E][K] extends string ? string : never;
};
type ElementPropGetters<E extends keyof HTMLElementTagNameMap> = {
	[K in keyof HTMLElementTagNameMap[E]]: () => HTMLElementTagNameMap[E][K];
};
export declare function element<E extends keyof HTMLElementTagNameMap>(name: E, staticAttrs: ElementStringProps<E>, dynamicAttrs: ElementPropGetters<E>, ...children: (Node | string)[]): HTMLElementTagNameMap[E] | Text;
export declare function child(getter: () => number | string | bigint | null | undefined | HTMLElement | Text): ChildNode;
type ConditionalElement = {
	nodeGetter: () => CharacterData;
	conditionGetter?: () => boolean;
};
export declare function choose(...choices: ConditionalElement[]): Node;
declare const RecordMutation: unique symbol;
declare const RecordDependency: unique symbol;
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
type ReadonlyDeep<T extends object> = {
	readonly [K in keyof T]: T[K] extends Array<infer E> ? ReadonlyArray<E> : T[K] extends Set<infer E> ? ReadonlySet<E> : T[K] extends Map<infer D, infer E> ? ReadonlyMap<D, E> : T[K] extends Function ? T[K] : T[K] extends object ? ReadonlyDeep<T[K]> : T[K];
};
type Subscription = {
	dispose(): void;
};
export declare class PropReference<T = any> {
	#private;
	readonly object: any;
	readonly prop: Key;
	constructor(object: object, prop: Key);
	subscribe(dependencyList: DependencyList): Subscription;
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
export declare function createOrRetrievePropRef(object: object, key: Key): PropReference<unknown>;
export declare function createOrRetrievePropRef<TObj extends object, TKey extends Key & keyof TObj>(object: TObj, prop: TKey): PropReference<TObj[TKey]>;
export declare class DependencyList {
	#private;
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
export declare function isTracked(obj: object): boolean;
export declare function PromiseLoader(promise: Promise<Node>, spinner?: Node): DocumentFragment;
type EffectOptions = {
	suppressUntrackedWarning?: boolean;
	tracker?: Tracker;
};
export declare function effect(sideEffect: (dep: DependencyList) => (void | (() => void)), options?: EffectOptions): Subscription;
type Route = {
	pattern: RegExp | string;
	element: Node | ((match: RegExpExecArray) => Node);
	suppressScroll?: boolean;
} | {
	element: Node | (() => Node);
	suppressScroll?: boolean;
};
export declare function Router(...routes: Route[]): Node;
export declare const version: string;

export {};
