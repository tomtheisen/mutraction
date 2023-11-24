// Generated by dts-bundle-generator v8.0.1

type Key = string | symbol;
type BaseSingleMutation = {
	target: object;
	name: Key;
	timestamp: Date;
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
type SetAdd = BaseSingleMutation & {
	type: "setadd";
	newValue: any;
};
type SetDelete = BaseSingleMutation & {
	type: "setdelete";
	oldValue: any;
};
type SetClear = BaseSingleMutation & {
	type: "setclear";
	oldValues: any[];
};
type SetMutation = SetAdd | SetDelete | SetClear;
type MapCreate = BaseSingleMutation & {
	type: "mapcreate";
	key: any;
	newValue: any;
};
type MapChange = BaseSingleMutation & {
	type: "mapchange";
	key: any;
	oldValue: any;
	newValue: any;
};
type MapDelete = BaseSingleMutation & {
	type: "mapdelete";
	key: any;
	oldValue: any;
};
type MapClear = BaseSingleMutation & {
	type: "mapclear";
	oldEntries: [
		key: any,
		value: any
	][];
};
type MapMutation = MapCreate | MapChange | MapDelete | MapClear;
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
type ArrayMutation = ArrayExtend | ArrayShorten;
type SingleMutation = {
	targetPath?: string;
} & (CreateProperty | DeleteProperty | ChangeProperty | ArrayMutation | SetMutation | MapMutation);
type Transaction = {
	type: "transaction";
	transactionName?: string;
	parent?: Transaction;
	operations: Mutation[];
	dependencies: Set<PropReference>;
	timestamp: Date;
};
type Mutation = SingleMutation | Transaction;
type ReadonlyDeep<T extends object> = {
	readonly [K in keyof T]: T[K] extends Array<infer E> ? ReadonlyArray<E> : T[K] extends Set<infer E> ? ReadonlySet<E> : T[K] extends Map<infer D, infer E> ? ReadonlyMap<D, E> : T[K] extends Function ? T[K] : T[K] extends object ? ReadonlyDeep<T[K]> : T[K];
};
type Subscription = {
	dispose(): void;
};
type NodeOptions = {
	node: Node;
	cleanup?: () => void;
};
type NodeModifierAttribute = {
	readonly $muType: "attribute";
	name: string;
	value: string;
};
type NodeModifier = NodeModifierAttribute;
/**
 * Represents a particular named property on a particular object.
 * Similar to a property descriptor.
 */
export declare class PropReference<T = any> {
	#private;
	readonly object: any;
	readonly prop: Key;
	get subscribers(): ReadonlySet<DependencyList>;
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
declare const RecordMutation: unique symbol;
declare const RecordDependency: unique symbol;
declare const defaultTrackerOptions: {
	trackHistory: boolean;
	autoTransactionalize: boolean;
	compactOnCommit: boolean;
};
export type TrackerOptions = Partial<typeof defaultTrackerOptions>;
/**
 * Oversees object mutations and allows history manipulation.
 * @see track
 */
export declare class Tracker {
	#private;
	options: Readonly<Required<TrackerOptions>>;
	constructor(options?: TrackerOptions);
	setOptions(options?: TrackerOptions): void;
	/**
	 * Turn on change tracking for an object.
	 * @param model
	 * @returns a proxied model object
	 */
	track<TModel extends object>(model: TModel): TModel;
	/**
	 * Turn on change tracking for an object.  This is behaviorally identical
	 * to `track()`.  It differs only in the typescript return type, which is a deep
	 * read-only type wrapper.  This might be useful if you want to enforce all mutations
	 * to be done through methods.
	 * @param model
	 * @returns a proxied model object
	 */
	trackAsReadonlyDeep<TModel extends object>(model: TModel): ReadonlyDeep<TModel>;
	/** Retrieves the mutation history.  Active transactions aren't represented here.
	 */
	get history(): ReadonlyArray<Readonly<Mutation>>;
	/** Add another transaction to the stack  */
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
	/** Repeat last undone mutation  */
	redo(): void;
	/** Clear the redo stack. Any direct mutation implicitly does this.
	 */
	clearRedos(): void;
	/** Commits all transactions, then empties the undo and redo history. */
	clearHistory(): void;
	/** record a mutation, if you have the secret key  */
	[RecordMutation](mutation: SingleMutation): void;
	/** Run the callback without calling any subscribers */
	ignoreUpdates(callback: () => void): void;
	/** Create a new `DependencyList` from this tracker  */
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
/** This is the default `Tracker` instance, and the one used for all JSX node updates
 * @see Tracker
 */
export declare const defaultTracker: Tracker;
/**
 * This is the main entry point of mutraction.  This returns a tracked proxy wrapping
 * the provided input object.  Always uses the default `Tracker`.
 * @see Tracker
 * @param model is a model object.  Primitive values cannot be tracked, since they cannot be mutated.
 * @returns a proxy-wrapped representation of the model object
 */
export declare function track<TModel extends object>(model: TModel): TModel;
type Subscriber = (trigger?: PropReference) => void;
declare class DependencyList {
	#private;
	active: boolean;
	constructor(tracker: Tracker);
	get trackedProperties(): ReadonlyArray<PropReference>;
	addDependency(propRef: PropReference): void;
	subscribe(callback: Subscriber): Subscription;
	notifySubscribers(trigger?: PropReference): void;
	endDependencyTrack(): void;
	/** Indicates that this dependency list is dependent on *all* tracked changes */
	trackAllChanges(): void;
	untrackAll(): void;
}
type ElementStringProps<E extends keyof HTMLElementTagNameMap> = {
	[K in keyof HTMLElementTagNameMap[E]]: HTMLElementTagNameMap[E][K] extends string ? string : never;
};
type ElementPropGetters<E extends keyof HTMLElementTagNameMap> = {
	[K in keyof HTMLElementTagNameMap[E]]: () => HTMLElementTagNameMap[E][K];
};
export declare function element<E extends keyof HTMLElementTagNameMap>(tagName: E, staticAttrs: ElementStringProps<E>, dynamicAttrs: ElementPropGetters<E>, ...children: (Node | string)[]): HTMLElementTagNameMap[E] | Text;
export declare function child(getter: () => number | string | bigint | null | undefined | HTMLElement | Text): ChildNode;
/**
 * Generates DOM nodes for an array of values.  The resulting nodes track the array indices.
 * Re-ordering the array will cause affected nodes to be re-generated.
 * @see ForEachPersist if you want DOM nodes to follow the array elements through order changes
 * @param array is the input array.  If it's a function returning an array, identity changes to the array itself will be tracked.
 * @param map is the callback function to produce DOM nodes
 * @returns a DOM node you can include in a document
 */
export declare function ForEach<TIn>(array: TIn[] | (() => TIn[]) | undefined, map: (item: TIn, index: number, array: TIn[]) => (Node | NodeOptions)): Node;
/**
 * Generates DOM nes for an array of objects.  The resulting nodes track the array elements.
 * Re-ordering the array will cause the generated nodes to re-ordered in parallel
 * @param array is the input array of objects.  Primitive element values can't be used. If it's a function returning an array, identity changes to the array itself will be tracked.
 * @param map is the callback function to produce DOM nodes
 * @returns a DOM node you can include in a document
 */
export declare function ForEachPersist<TIn extends object>(array: TIn[] | (() => TIn[]) | undefined, map: (e: TIn) => Node): Node;
type ConditionalElement = {
	nodeGetter: () => ChildNode;
	conditionGetter?: () => boolean;
};
export declare function choose(...choices: ConditionalElement[]): Node;
/**
 * checks whether the input is an object currently tracked by this instance of mutraction
 * @param obj value to check
 * @returns true if and only if the input is a proxy-wrapped object
 */
export declare function isTracked(obj: object): boolean;
type ErrorResult = Node | ((reason: any) => Node);
/**
 * Generates a DOM node that's replaced with loading data whenever it's ready.
 * @param promise is a promise resolving to a node with the loading data.
 * @param spinner optional - is loading indicator to display until the loading is done.
 * @returns a DOM node which contains the spinner, and then the loaded data.
 */
export declare function PromiseLoader(promise: Promise<Node>, spinner?: Node, onError?: ErrorResult): DocumentFragment;
/**
 * Automatically replaces an entire DOM node when its dependencies change.
 * Normally, only node contents and attributes are dynamically updated, but not DOM nodes themselves.
 * @param nodeFactory produces a DOM node, and has a dependency on one or more tracked properties.
 * @returns a DOM node that replaces itself when its dependencies change.
 */
export declare function Swapper(nodeFactory: () => Node | NodeOptions): DocumentFragment;
type EffectOptions = {
	suppressUntrackedWarning?: boolean;
	tracker?: Tracker;
};
type SideEffect = (dep: DependencyList, trigger?: PropReference) => (void | (() => void));
/**
 * Runs a callback, and remembers the tracked properties accessed.
 * Any time one of them changes, it runs the callback again.
 * Each time it runs, the set of dependencies is re-calculated so branches and short-circuits are generally safe.
 * @param sideEffect is the callback to invoke.
 * @param options
 * @returns a subscription that can be disposed to turn the effect off.
 */
export declare function effect(sideEffect: SideEffect, options?: EffectOptions): Subscription;
type Route = {
	pattern: RegExp | string;
	element: Node | ((match: RegExpExecArray) => Node);
	suppressScroll?: boolean;
} | {
	element: Node | (() => Node);
	suppressScroll?: boolean;
};
/**
 * A simple router that uses the #fragment part of the url.
 * The pattern array is iterated for a match every time the `hashchange` event fires.
 * @param routes is an array of pattern definitions
 * @returns an in-place updating DOM node
 */
export declare function Router(...routes: Route[]): Node;
/**
 * Makes a reusable scoped stylesheet that can be applied to JSX elements using `mu:apply`.
 * @param rules is a stylesheet object with selectors as keys and CSS rule delcaration objects as values.
 * @returns a node modifier that can be provided to `mu:apply`
 * @example
 * ```tsx
 * const myStyle = makeLocalStyle({
 *   "p": { fontFamily: "sans-serif" }
 * });
 * const app = <div mu:apply={ myStyle }>
 *   <p>Hello</p>
 * </div>;
 * ```
 */
export declare function makeLocalStyle(rules: Record<string, Partial<CSSStyleDeclaration>>): NodeModifier;
type Cloneable = string | number | bigint | symbol | boolean | Cloneable[] | {
	[key: string]: Cloneable;
};
/**
 * `untrackedClone` creates a deep clone of an object which is not tracked or proxied.
 * The main case where this is useful is doing an intensive computation which involves
 * making a lot of mutations.  The proxy layer and DOM synchronization of tracked objects
 * have a cost.  In some cases, it's faster to do the computations in an untracked
 * version of the object, and then put it back into a tracked model when the
 * expensive computation is complete.
 *
 * @ param obj is the object to clone.  It cannot be an instance of a class.
 * @ param maxDepth is the maximum depth of recursion.  The default is 10.
 * Reference cycles are not supported
 * @ example
 * const localPiece = untrackedClone(model.piece);
 * expensiveModifications(localPiece);
 * model.piece = localPiece;
 */
export declare function untrackedClone<T extends Cloneable & object>(obj: T, maxDepth?: number): T;
export declare const version: string;

export {};
