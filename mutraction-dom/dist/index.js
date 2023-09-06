// out/symbols.js
var RecordMutation = Symbol("RecordMutation");
var TrackerOf = Symbol("TrackerOf");
var ProxyOf = Symbol("ProxyOf");
var RecordDependency = Symbol("RecordDependency");
var GetOriginal = Symbol("GetOriginal");

// out/proxy.js
var mutatingArrayMethods = ["copyWithin", "fill", "pop", "push", "reverse", "shift", "sort", "splice", "unshift"];
function isArrayLength(value) {
  if (typeof value === "string")
    return isArrayIndex(value);
  return typeof value === "number" && (value & 2147483647) === value;
}
function isArrayIndex(name) {
  if (typeof name !== "string")
    return false;
  if (!/^\d{1,10}$/.test(name))
    return false;
  return parseInt(name, 10) < 2147483647;
}
function isArguments(item) {
  return Object.prototype.toString.call(item) === "[object Arguments]";
}
function linkProxyToObject(obj, proxy) {
  Object.defineProperty(obj, ProxyOf, {
    enumerable: false,
    writable: true,
    configurable: false
  });
  obj[ProxyOf] = proxy;
}
function isTrackable(val) {
  if (val == null)
    return false;
  if (typeof val !== "object")
    return false;
  if (isTracked(val))
    return false;
  if (val instanceof Promise)
    return false;
  return true;
}
function makeProxyHandler(model, tracker) {
  function getOrdinary(target, name, receiver) {
    if (name === TrackerOf)
      return tracker;
    if (name === GetOriginal)
      return target;
    tracker[RecordDependency](createOrRetrievePropRef(target, name));
    let result = Reflect.get(target, name, receiver);
    if (isTrackable(result)) {
      const original = result;
      const handler = makeProxyHandler(original, tracker);
      result = target[name] = new Proxy(original, handler);
      linkProxyToObject(original, result);
    }
    if (typeof result === "function" && tracker.options.autoTransactionalize && name !== "constructor") {
      let proxyWrapped2 = function() {
        const autoTransaction = tracker.startTransaction(original.name ?? "auto");
        try {
          return original.apply(receiver, arguments);
        } finally {
          if (autoTransaction.operations.length > 0) {
            tracker.commit(autoTransaction);
          } else {
            tracker.rollback(autoTransaction);
          }
        }
      };
      var proxyWrapped = proxyWrapped2;
      const original = result;
      return proxyWrapped2;
    }
    return result;
  }
  function getArrayTransactionShim(target, name, receiver) {
    if (typeof name === "string" && mutatingArrayMethods.includes(name)) {
      let proxyWrapped2 = function() {
        const arrayTransaction = tracker.startTransaction(String(name));
        const arrayResult = arrayFunction.apply(receiver, arguments);
        tracker.commit(arrayTransaction);
        return arrayResult;
      };
      var proxyWrapped = proxyWrapped2;
      const arrayFunction = target[name];
      return proxyWrapped2;
    } else {
      return getOrdinary(target, name, receiver);
    }
  }
  let setsCompleted = 0;
  function setOrdinary(target, name, newValue, receiver) {
    if (isTrackable(newValue)) {
      const handler = makeProxyHandler(newValue, tracker);
      newValue = new Proxy(newValue, handler);
    }
    const mutation = name in target ? { type: "change", target, name, oldValue: model[name], newValue } : { type: "create", target, name, newValue };
    const initialSets = setsCompleted;
    const wasSet = Reflect.set(target, name, newValue, receiver);
    if (wasSet && initialSets == setsCompleted++) {
      tracker[RecordMutation](mutation);
    }
    return wasSet;
  }
  function setArray(target, name, newValue, receiver) {
    if (!Array.isArray(target)) {
      throw Error("This object used to be an array.  Expected an array.");
    }
    if (name === "length") {
      if (!isArrayLength(newValue))
        target.length = newValue;
      const oldLength = target.length;
      const newLength = parseInt(newValue, 10);
      if (newLength < oldLength) {
        const removed = Object.freeze(target.slice(newLength, oldLength));
        const shorten = {
          type: "arrayshorten",
          target,
          name,
          oldLength,
          newLength,
          removed
        };
        const wasSet = Reflect.set(target, name, newValue, receiver);
        tracker[RecordMutation](shorten);
        ++setsCompleted;
        return wasSet;
      }
    }
    if (isArrayIndex(name)) {
      const index = parseInt(name, 10);
      if (index >= target.length) {
        const extension = {
          type: "arrayextend",
          target,
          name,
          oldLength: target.length,
          newIndex: index,
          newValue
        };
        const wasSet = Reflect.set(target, name, newValue, receiver);
        tracker[RecordMutation](extension);
        ++setsCompleted;
        return wasSet;
      }
    }
    return setOrdinary(target, name, newValue, receiver);
  }
  function deleteProperty(target, name) {
    const mutation = { type: "delete", target, name, oldValue: model[name] };
    const wasDeleted = Reflect.deleteProperty(target, name);
    if (wasDeleted) {
      tracker[RecordMutation](mutation);
    }
    return wasDeleted;
  }
  let set = setOrdinary, get = getOrdinary;
  if (Array.isArray(model)) {
    set = setArray;
    if (tracker.options.trackHistory)
      get = getArrayTransactionShim;
  }
  if (isArguments(model))
    throw Error("Tracking of exotic arguments objects not supported");
  return { get, set, deleteProperty };
}
function isTracked(obj) {
  return typeof obj === "object" && !!obj[TrackerOf];
}

// out/propref.js
var PropReference = class {
  object;
  prop;
  #subscribers = /* @__PURE__ */ new Set();
  #notifying = false;
  get subscribers() {
    return this.#subscribers;
  }
  constructor(object, prop) {
    if (!isTracked(object) && object[ProxyOf]) {
      object = object[ProxyOf];
    }
    this.object = object;
    this.prop = prop;
  }
  subscribe(dependencyList) {
    this.#subscribers.add(dependencyList);
    return {
      dispose: () => {
        this.#subscribers.delete(dependencyList);
      }
    };
  }
  notifySubscribers() {
    if (this.#notifying)
      console.warn(`Re-entrant property subscription for '${String(this.prop)}'`);
    const subscriberSnapshot = Array.from(this.#subscribers);
    this.#notifying = true;
    for (const dep of subscriberSnapshot)
      dep.notifySubscribers();
    this.#notifying = false;
  }
  get current() {
    return this.object[this.prop];
  }
  set current(newValue) {
    this.object[this.prop] = newValue;
  }
};
var propRefRegistry = /* @__PURE__ */ new WeakMap();
function createOrRetrievePropRef(object, prop) {
  let objectPropRefs = propRefRegistry.get(object);
  if (!objectPropRefs)
    propRefRegistry.set(object, objectPropRefs = /* @__PURE__ */ new Map());
  let result = objectPropRefs.get(prop);
  if (!result)
    objectPropRefs.set(prop, result = new PropReference(object, prop));
  return result;
}

// out/dependency.js
var DependencyList = class {
  #trackedProperties = /* @__PURE__ */ new Map();
  #tracker;
  #tracksAllChanges = false;
  #subscribers = /* @__PURE__ */ new Set();
  active = true;
  constructor(tracker) {
    this.#tracker = tracker;
  }
  get trackedProperties() {
    return Array.from(this.#trackedProperties.keys());
  }
  addDependency(propRef) {
    if (this.active && !this.#tracksAllChanges) {
      if (this.#trackedProperties.has(propRef))
        return;
      const propSubscription = propRef.subscribe(this);
      this.#trackedProperties.set(propRef, propSubscription);
    }
  }
  subscribe(callback) {
    this.#subscribers.add(callback);
    return { dispose: () => this.#subscribers.delete(callback) };
  }
  notifySubscribers() {
    const subscriberSnapshot = Array.from(this.#subscribers);
    for (const callback of subscriberSnapshot)
      callback();
  }
  endDependencyTrack() {
    this.#tracker.endDependencyTrack(this);
  }
  /** Indicates that this dependency list is dependent on *all* tracked changes */
  trackAllChanges() {
    if (this.#tracksAllChanges)
      return;
    this.untrackAll();
    const historyPropRef = createOrRetrievePropRef(this.#tracker, "history");
    this.addDependency(historyPropRef);
    this.#tracksAllChanges = true;
  }
  untrackAll() {
    for (const sub of this.#trackedProperties.values())
      sub.dispose();
    this.#trackedProperties.clear();
  }
};

// out/compactTransaction.js
function compactTransaction({ operations }) {
  for (let i = 0; i < operations.length; ) {
    const currOp = operations[i];
    if (currOp.type === "transaction") {
      operations.splice(i, 1, ...currOp.operations);
    } else if (currOp.type === "change" && Object.is(currOp.oldValue, currOp.newValue)) {
      operations.splice(i, 1);
    } else if (i > 0) {
      const prevOp = operations[i - 1];
      if (prevOp.type === "transaction") {
        throw Error("Internal mutraction error.  Found internal transaction on look-back during packTransaction.");
      } else if (prevOp.target !== currOp.target || prevOp.name !== currOp.name) {
        ++i;
      } else if (prevOp.type === "create" && currOp.type === "change") {
        operations.splice(--i, 2, { ...prevOp, newValue: currOp.newValue });
      } else if (prevOp.type === "create" && currOp.type === "delete") {
        operations.splice(--i, 2);
      } else if (prevOp.type === "change" && currOp.type === "change") {
        operations.splice(--i, 2, { ...prevOp, newValue: currOp.newValue });
      } else if (prevOp.type === "change" && currOp.type === "delete") {
        operations.splice(--i, 2, { ...currOp, oldValue: prevOp.oldValue });
      } else if (prevOp.type === "delete" && currOp.type === "create") {
        operations.splice(--i, 2, { ...currOp, ...prevOp, type: "change" });
      } else
        ++i;
    } else
      ++i;
  }
}

// out/tracker.js
var defaultTrackerOptions = {
  trackHistory: true,
  autoTransactionalize: true,
  compactOnCommit: true
};
var Tracker = class {
  #transaction;
  #operationHistory;
  #redos = [];
  options;
  // If defined this will be the prop reference for the "history" property of this Tracker instance
  // If so, it should be notified whenever the history is affected
  //      mutations outside of transactions
  //      non-nested transaction committed
  #historyPropRef;
  constructor(options = {}) {
    if (options.trackHistory === false && options.compactOnCommit == null) {
      options.compactOnCommit = false;
    }
    const appliedOptions = { ...defaultTrackerOptions, ...options };
    if (appliedOptions.autoTransactionalize && !appliedOptions.trackHistory)
      throw Error("Option autoTransactionalize requires option trackHistory");
    if (appliedOptions.compactOnCommit && !appliedOptions.trackHistory) {
      throw Error("Option compactOnCommit requires option trackHistory");
    }
    if (appliedOptions.trackHistory) {
      this.#operationHistory = [];
    }
    this.options = Object.freeze(appliedOptions);
  }
  /**
   * Turn on change tracking for an object.
   * @param model
   * @returns a proxied model object
   */
  track(model) {
    if (isTracked(model))
      throw Error("Object already tracked");
    const proxied = new Proxy(model, makeProxyHandler(model, this));
    Object.defineProperty(model, ProxyOf, {
      enumerable: false,
      writable: true,
      configurable: false
    });
    model[ProxyOf] = proxied;
    return proxied;
  }
  /**
   * Turn on change tracking for an object.  This is behaviorally identical
   * to `track()`.  It differs only in the typescript return type, which is a deep
   * read-only type wrapper.  This might be useful if you want to enforce all mutations
   * to be done through methods.
   * @param model
   * @returns a proxied model object
   */
  trackAsReadonlyDeep(model) {
    return this.track(model);
  }
  #ensureHistory() {
    if (!this.options.trackHistory)
      throw Error("History tracking disabled.");
  }
  /** Retrieves the mutation history.  Active transactions aren't represented here.
   */
  get history() {
    this.#ensureHistory();
    this.#dependencyTrackers[0]?.trackAllChanges();
    this.#historyPropRef ??= createOrRetrievePropRef(this, "history");
    if (!this.#operationHistory)
      throw Error("History tracking enabled, but no root transaction. Probably mutraction internal error.");
    return this.#operationHistory;
  }
  /** Add another transaction to the stack  */
  startTransaction(name) {
    this.#ensureHistory();
    this.#transaction = { type: "transaction", parent: this.#transaction, operations: [], dependencies: /* @__PURE__ */ new Set() };
    if (name)
      this.#transaction.transactionName = name;
    return this.#transaction;
  }
  /** resolve and close the most recent transaction
    * throws if no transactions are active
    */
  commit(transaction) {
    this.#ensureHistory();
    if (!this.#transaction)
      throw Error("Attempted to commit transaction when none were open.");
    if (transaction && transaction !== this.#transaction)
      throw Error("Attempted to commit wrong transaction. Transactions must be resolved in stack order.");
    if (this.options.compactOnCommit)
      compactTransaction(this.#transaction);
    if (this.#transaction.parent) {
      this.#transaction.parent.operations.push(this.#transaction);
      this.#transaction.dependencies.forEach((d) => this.#transaction.parent.dependencies.add(d));
      this.#transaction = this.#transaction.parent;
    } else {
      this.#operationHistory.push(this.#transaction);
      const allDependencyLists = /* @__PURE__ */ new Set();
      for (const propRef of this.#transaction.dependencies) {
        for (const dependencyList of propRef.subscribers) {
          allDependencyLists.add(dependencyList);
        }
      }
      allDependencyLists.forEach((depList) => depList.notifySubscribers());
      this.#transaction = void 0;
    }
    if (this.#transaction == null) {
      this.#historyPropRef?.notifySubscribers();
    }
  }
  /** undo all operations done since the beginning of the most recent trasaction
   * remove it from the transaction stack
   * if no transactions are active, undo all mutations
   */
  rollback(transaction) {
    this.#ensureHistory();
    if (transaction && transaction !== this.#transaction)
      throw Error("Attempted to commit wrong transaction. Transactions must be resolved in stack order.");
    if (this.#transaction) {
      while (this.#transaction.operations.length)
        this.undo();
      this.#transaction = this.#transaction.parent;
    } else {
      while (this.#operationHistory.length)
        this.undo();
    }
  }
  /** undo last mutation or transaction and push into the redo stack  */
  undo() {
    this.#ensureHistory();
    const mutation = (this.#transaction?.operations ?? this.#operationHistory).pop();
    if (!mutation)
      return;
    this.#undoOperation(mutation);
    this.#redos.unshift(mutation);
    if (this.#transaction == null) {
      this.#historyPropRef?.notifySubscribers();
    }
  }
  #undoOperation(mutation) {
    if (mutation.type === "transaction") {
      for (let i = mutation.operations.length; i-- > 0; ) {
        this.#undoOperation(mutation.operations[i]);
      }
    } else {
      const targetAny = mutation.target;
      switch (mutation.type) {
        case "change":
        case "delete":
          targetAny[mutation.name] = mutation.oldValue;
          break;
        case "create":
          delete targetAny[mutation.name];
          break;
        case "arrayextend":
          targetAny.length = mutation.oldLength;
          break;
        case "arrayshorten":
          targetAny.push(...mutation.removed);
          break;
        default:
          mutation;
      }
      if (!this.#transaction) {
        createOrRetrievePropRef(mutation.target, mutation.name).notifySubscribers();
        if (mutation.type === "arrayextend" || mutation.type === "arrayshorten") {
          createOrRetrievePropRef(mutation.target, "length").notifySubscribers();
        }
      }
    }
  }
  /** Repeat last undone mutation  */
  redo() {
    this.#ensureHistory();
    const mutation = this.#redos.shift();
    if (!mutation)
      return;
    this.#redoOperation(mutation);
    (this.#transaction?.operations ?? this.#operationHistory).push(mutation);
    if (this.#transaction == null) {
      this.#historyPropRef?.notifySubscribers();
    }
  }
  #redoOperation(mutation) {
    if (mutation.type === "transaction") {
      for (const operation of mutation.operations) {
        this.#redoOperation(operation);
      }
    } else {
      const targetAny = mutation.target;
      switch (mutation.type) {
        case "change":
        case "create":
          targetAny[mutation.name] = mutation.newValue;
          break;
        case "delete":
          delete targetAny[mutation.name];
          break;
        case "arrayextend":
          targetAny[mutation.newIndex] = mutation.newValue;
          break;
        case "arrayshorten":
          targetAny.length = mutation.newLength;
          break;
        default:
          mutation;
      }
      if (!this.#transaction) {
        createOrRetrievePropRef(mutation.target, mutation.name).notifySubscribers();
        if (mutation.type === "arrayextend" || mutation.type === "arrayshorten") {
          createOrRetrievePropRef(mutation.target, "length").notifySubscribers();
        }
      }
    }
  }
  /** Clear the redo stack. Any direct mutation implicitly does this.
   */
  clearRedos() {
    this.#redos.length = 0;
  }
  /** Commits all transactions, then empties the undo and redo history. */
  clearHistory() {
    this.#ensureHistory();
    this.#transaction = void 0;
    this.#operationHistory.length = 0;
    this.clearRedos();
  }
  /** record a mutation, if you have the secret key  */
  [RecordMutation](mutation) {
    if (this.options.trackHistory) {
      (this.#transaction?.operations ?? this.#operationHistory).push(Object.freeze(mutation));
    }
    this.clearRedos();
    if (this.#transaction) {
      this.#transaction.dependencies.add(createOrRetrievePropRef(mutation.target, mutation.name));
      if (mutation.type === "arrayextend" || mutation.type === "arrayshorten") {
        this.#transaction.dependencies.add(createOrRetrievePropRef(mutation.target, "length"));
      }
    } else {
      createOrRetrievePropRef(mutation.target, mutation.name).notifySubscribers();
      if (mutation.type === "arrayextend" || mutation.type === "arrayshorten") {
        createOrRetrievePropRef(mutation.target, "length").notifySubscribers();
      }
      this.#historyPropRef?.notifySubscribers();
    }
  }
  #dependencyTrackers = [];
  /** Create a new `DependencyList` from this tracker  */
  startDependencyTrack() {
    const deps = new DependencyList(this);
    this.#dependencyTrackers.unshift(deps);
    return deps;
  }
  endDependencyTrack(dep) {
    if (this.#dependencyTrackers[0] !== dep)
      throw Error("Specified dependency list is not top of stack");
    this.#dependencyTrackers.shift();
    return dep;
  }
  [RecordDependency](propRef) {
    this.#dependencyTrackers[0]?.addDependency(propRef);
    if (this.#gettingPropRef)
      this.#lastPropRef = propRef;
  }
  #gettingPropRef = false;
  #lastPropRef = void 0;
  /**
   * Gets a property reference that refers to a particular property on a particular object.
   * It can get or set the target property value using the `current` property, so it's a valid React ref.
   * If there's an existing PropRef matching the arguments, it will be returned.
   * A new one will be created only if necessary.
   * @param propGetter parameter-less function that gets the target property value e.g. `() => model.settings.logFile`
   * @returns PropReference for an object property
   */
  getPropRef(propGetter) {
    const result = this.getPropRefTolerant(propGetter);
    if (!result)
      throw Error("No tracked properties.  Prop ref detection requires a tracked object.");
    return result;
  }
  getPropRefTolerant(propGetter) {
    if (this.#gettingPropRef)
      throw Error("Cannot be called re-entrantly.");
    this.#gettingPropRef = true;
    this.#lastPropRef = void 0;
    try {
      const actualValue = propGetter();
      if (!this.#lastPropRef)
        return void 0;
      const propRefCurrent = this.#lastPropRef.current;
      if (!Object.is(actualValue, propRefCurrent))
        console.error("The last operation of the callback must be a property get.\n`(foo || bar).quux` is allowed, but `foo.bar + 1` is not");
      return this.#lastPropRef;
    } finally {
      this.#gettingPropRef = false;
    }
  }
};
var defaultTracker = new Tracker();
function track(model) {
  return defaultTracker.track(model);
}

// out/effect.js
var emptyEffect = { dispose: () => {
} };
function effect(sideEffect, options = {}) {
  const { tracker = defaultTracker, suppressUntrackedWarning = false } = options;
  let dep = tracker.startDependencyTrack();
  let lastResult = sideEffect(dep);
  dep.endDependencyTrack();
  if (dep.trackedProperties.length === 0) {
    if (!suppressUntrackedWarning) {
      console.warn("effect() callback has no dependencies on any tracked properties.  It will not fire again.");
    }
    return emptyEffect;
  }
  let subscription = dep.subscribe(effectDependencyChanged);
  const dispose = () => {
    dep.untrackAll();
    subscription.dispose();
  };
  function effectDependencyChanged() {
    lastResult?.();
    dispose();
    dep = tracker.startDependencyTrack();
    lastResult = sideEffect(dep);
    dep.endDependencyTrack();
    subscription = dep.subscribe(effectDependencyChanged);
  }
  return { dispose };
}

// out/runtime.js
var suppress = { suppressUntrackedWarning: true };
function effectDefault(sideEffect) {
  effect(sideEffect, suppress);
}
function isNodeModifier(obj) {
  return obj != null && typeof obj === "object" && "$muType" in obj && typeof obj.$muType === "string";
}
function doApply(el, mod) {
  if (Array.isArray(mod)) {
    mod.forEach((mod2) => doApply(el, mod2));
    return;
  }
  if (!isNodeModifier(mod))
    throw Error("Expected a node modifier for 'mu:apply', but got " + typeof mod);
  switch (mod.$muType) {
    case "attribute":
      el.setAttribute(mod.name, mod.value);
      break;
    default:
      throw Error("Unknown node modifier type: " + mod.$muType);
  }
}
function element(name, staticAttrs, dynamicAttrs, ...children) {
  const el = document.createElement(name);
  el.append(...children);
  let syncEvents;
  for (let [name2, value] of Object.entries(staticAttrs)) {
    switch (name2) {
      case "mu:syncEvent":
        syncEvents = value;
        break;
      case "mu:apply":
        doApply(el, value);
        break;
      default:
        el[name2] = value;
        break;
    }
  }
  const syncedProps = syncEvents ? [] : void 0;
  for (let [name2, getter] of Object.entries(dynamicAttrs)) {
    if (syncedProps && name2 in el) {
      const propRef = defaultTracker.getPropRefTolerant(getter);
      if (propRef) {
        syncedProps.push([name2, propRef]);
      }
    }
    switch (name2) {
      case "style":
        effectDefault(() => {
          Object.assign(el.style, getter());
        });
        break;
      case "classList":
        effectDefault(() => {
          const classMap = getter();
          for (const e of Object.entries(classMap))
            el.classList.toggle(...e);
        });
        break;
      default:
        effectDefault(() => {
          el[name2] = getter();
        });
        break;
    }
  }
  if (syncEvents && syncedProps?.length) {
    for (const e of syncEvents.matchAll(/\S+/g)) {
      el.addEventListener(e[0], () => {
        for (const [name2, propRef] of syncedProps)
          propRef.current = el[name2];
      });
    }
  }
  return el;
}
function child(getter) {
  const result = getter();
  if (result instanceof Node)
    return result;
  let node = document.createTextNode("");
  effectDefault(() => {
    const newNode = document.createTextNode(String(getter() ?? ""));
    node.replaceWith(newNode);
    node = newNode;
  });
  return node;
}

// out/elementSpan.js
var ElementSpan = class {
  static id = 0;
  startMarker = document.createTextNode("");
  endMarker = document.createTextNode("");
  constructor(...node) {
    const frag = document.createDocumentFragment();
    frag.append(this.startMarker, ...node, this.endMarker);
  }
  /** extracts the entire span as a fragment */
  removeAsFragment() {
    if (this.startMarker.parentNode instanceof DocumentFragment) {
      return this.startMarker.parentNode;
    }
    const nodes = [];
    for (let walk = this.startMarker; ; walk = walk?.nextSibling) {
      if (walk == null)
        throw Error("End marker not found as subsequent document sibling as start marker");
      nodes.push(walk);
      if (Object.is(walk, this.endMarker))
        break;
    }
    const result = document.createDocumentFragment();
    result.append(...nodes);
    return result;
  }
  /** extracts the interior of the span into a fragment, leaving the span container empty */
  emptyAsFragment() {
    const nodes = [];
    for (let walk = this.startMarker.nextSibling; ; walk = walk?.nextSibling) {
      if (walk == null)
        throw Error("End marker not found as subsequent document sibling as start marker");
      if (Object.is(walk, this.endMarker))
        break;
      nodes.push(walk);
    }
    const result = document.createDocumentFragment();
    result.append(...nodes);
    return result;
  }
  /** removes the interior contents of the span */
  clear() {
    while (!Object.is(this.startMarker.nextSibling, this.endMarker)) {
      if (this.startMarker.nextSibling == null)
        throw Error("End marker not found as subsequent document sibling as start marker");
      this.startMarker.nextSibling.remove();
    }
  }
  /** replaces the interior contents of the span */
  replaceWith(...nodes) {
    this.clear();
    this.append(...nodes);
  }
  append(...nodes) {
    const frag = document.createDocumentFragment();
    frag.append(...nodes);
    if (!this.endMarker.parentNode)
      throw Error("End marker of ElementSpan has no parent");
    this.endMarker.parentNode.insertBefore(frag, this.endMarker);
  }
};

// out/types.js
function isNodeOptions(arg) {
  return arg != null && typeof arg === "object" && "node" in arg && arg.node instanceof Node;
}

// out/foreach.js
var suppress2 = { suppressUntrackedWarning: true };
function ForEach(array, map) {
  const result = new ElementSpan();
  const outputs = [];
  effect((lengthDep) => {
    for (let i = outputs.length; i < array.length; i++) {
      const output = { container: new ElementSpan() };
      outputs.push(output);
      effect((itemDep) => {
        output.cleanup?.();
        const item = array[i];
        const projection = item !== void 0 ? map(item, i, array) : document.createTextNode("");
        if (isNodeOptions(projection)) {
          output.container.replaceWith(projection.node);
          output.cleanup = projection.cleanup;
        } else {
          output.container.replaceWith(projection);
          output.cleanup = void 0;
        }
      }, suppress2);
      result.append(output.container.removeAsFragment());
    }
    while (outputs.length > array.length) {
      const { cleanup, container } = outputs.pop();
      cleanup?.();
      container.removeAsFragment();
    }
  }, suppress2);
  return result.removeAsFragment();
}
function ForEachPersist(array, map) {
  const result = new ElementSpan();
  const containers = [];
  const outputMap = /* @__PURE__ */ new WeakMap();
  effect(() => {
    for (let i = containers.length; i < array.length; i++) {
      const container = new ElementSpan();
      containers.push(container);
      effect((dep) => {
        container.emptyAsFragment();
        const item = array[i];
        if (item == null)
          return;
        if (typeof item !== "object")
          throw Error("Elements must be object in ForEachPersist");
        let newContents = outputMap.get(item);
        if (newContents == null) {
          if (dep)
            dep.active = false;
          let newNode = map(item);
          newContents = newNode instanceof HTMLElement ? newNode : new ElementSpan(newNode);
          outputMap.set(item, newContents);
          if (dep)
            dep.active = true;
        }
        if (newContents instanceof HTMLElement) {
          container.replaceWith(newContents);
        } else {
          container.replaceWith(newContents.removeAsFragment());
        }
      }, suppress2);
      result.append(container.removeAsFragment());
    }
    while (containers.length > array.length) {
      containers.pop().removeAsFragment();
    }
  }, suppress2);
  return result.removeAsFragment();
}

// out/memoize.js
function memoize(getter) {
  let isResolved = false;
  let value = void 0;
  function resolveLazy() {
    return isResolved ? value : (isResolved = true, value = getter());
  }
  return resolveLazy;
}

// out/choose.js
var suppress3 = { suppressUntrackedWarning: true };
function choose(...choices) {
  const lazyChoices = [];
  let foundUnconditional = false;
  for (const choice of choices) {
    if ("conditionGetter" in choice) {
      lazyChoices.push({
        nodeGetter: memoize(choice.nodeGetter),
        conditionGetter: choice.conditionGetter
      });
    } else {
      lazyChoices.push({
        nodeGetter: memoize(choice.nodeGetter)
      });
      foundUnconditional = true;
      break;
    }
  }
  if (!foundUnconditional) {
    const empty = document.createTextNode("");
    lazyChoices.push({ nodeGetter: () => empty });
  }
  let current = document.createTextNode("");
  effect(() => {
    for (const { nodeGetter, conditionGetter } of lazyChoices) {
      if (!conditionGetter || conditionGetter()) {
        const newNode = nodeGetter();
        current.replaceWith(newNode);
        current = newNode;
        break;
      }
    }
  }, suppress3);
  return current;
}

// out/promiseLoader.js
function defaultError(reason) {
  return document.createTextNode(String(reason));
}
function PromiseLoader(promise, spinner = document.createTextNode(""), onError = defaultError) {
  const span = new ElementSpan(spinner);
  promise.then((result) => span.replaceWith(result));
  promise.catch((reason) => span.replaceWith(typeof onError === "function" ? onError(reason) : onError));
  return span.removeAsFragment();
}

// out/errorBoundary.js
function ErrorBoundary(nodeFactory, showErr) {
  try {
    return nodeFactory();
  } catch (ex) {
    return showErr(ex);
  }
}

// out/swapper.js
function Swapper(nodeFactory) {
  const span = new ElementSpan();
  let cleanup;
  effect(() => {
    cleanup?.();
    const output = nodeFactory();
    if (isNodeOptions(output)) {
      span.replaceWith(output.node);
      cleanup = output.cleanup;
    } else {
      span.replaceWith(output);
      cleanup = void 0;
    }
  });
  return span.removeAsFragment();
}

// out/router.js
var fragmentMap = /* @__PURE__ */ new WeakMap();
function Router(...routes) {
  if (routes.some((route) => "pattern" in route && route.pattern instanceof RegExp && route.pattern.global))
    throw Error("Global-flagged route patterns not supported");
  const container = new ElementSpan();
  let lastResolvedSpan;
  function hashChangeHandler(url) {
    const { hash } = new URL(url);
    for (const route of routes) {
      let execResult = void 0;
      let match = false;
      if ("pattern" in route) {
        if (typeof route.pattern === "string")
          match = hash === route.pattern;
        else
          match = !!(execResult = route.pattern.exec(hash) ?? void 0);
      } else {
        match = true;
      }
      if (match) {
        lastResolvedSpan?.removeAsFragment();
        lastResolvedSpan = void 0;
        const { element: element2 } = route;
        const newNode = typeof element2 === "function" ? element2(execResult) : element2;
        if (newNode instanceof DocumentFragment) {
          let span = fragmentMap.get(newNode);
          if (!span)
            fragmentMap.set(newNode, span = new ElementSpan(newNode));
          lastResolvedSpan = span;
          container.replaceWith(span.removeAsFragment());
        } else {
          lastResolvedSpan = void 0;
          container.replaceWith(newNode);
        }
        if (!route.suppressScroll)
          window.scrollTo(0, 0);
        return;
      }
    }
    container.emptyAsFragment();
  }
  window.addEventListener("hashchange", (ev) => hashChangeHandler(ev.newURL));
  hashChangeHandler(location.href);
  return container.removeAsFragment();
}

// out/makeLocalStyle.js
var scopeAttrName = "data-mu-style";
var instanceId = String(Math.random() * 1e6 | 0);
var counter = 0;
function makeLocalStyle(rules) {
  const sheet = new CSSStyleSheet();
  const sheetId = instanceId + "-" + ++counter;
  for (const [selector, declarations] of Object.entries(rules)) {
    const attributeMatch = `[${scopeAttrName}="${sheetId}"]`;
    const localSelector = `${attributeMatch}:is(${selector}), ${attributeMatch} :is(${selector}) {}`;
    sheet.insertRule(localSelector, 0);
    const rule = sheet.cssRules.item(0);
    Object.assign(rule.style, declarations);
  }
  document.adoptedStyleSheets.push(sheet);
  return { $muType: "attribute", name: scopeAttrName, value: sheetId };
}

// out/init.js
console.log("setting up mutraction");

// out/index.js
var version = "0.19.1";
export {
  DependencyList,
  ErrorBoundary,
  ForEach,
  ForEachPersist,
  PromiseLoader,
  PropReference,
  Router,
  Swapper,
  Tracker,
  child,
  choose,
  createOrRetrievePropRef,
  defaultTracker,
  effect,
  element,
  isTracked,
  makeLocalStyle,
  track,
  version
};
