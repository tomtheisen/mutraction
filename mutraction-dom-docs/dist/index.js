// ../mutraction-dom/dist/index.js
var emptyEffect = { dispose: () => {
} };
function effect(tracker, sideEffect, options = {}) {
  let dep = tracker.startDependencyTrack();
  let lastResult = sideEffect(dep);
  dep.endDependencyTrack();
  if (dep.trackedProperties.length === 0) {
    if (!options.suppressUntrackedWarning) {
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
function getConfig(name) {
  const meta = globalThis.document?.querySelector(`meta[name=${name.replace(/\W/g, "\\$&")}]`);
  return meta?.getAttribute("value") ?? void 0;
}
var showMarkers = !!getConfig("mu:show-markers");
function getMarker(mark) {
  return document.createTextNode(showMarkers ? `\u27EA${mark}\u27EB` : "");
}
var ElementSpan = class _ElementSpan {
  static id = 0;
  startMarker = getMarker("start:" + ++_ElementSpan.id);
  endMarker = getMarker("end:" + _ElementSpan.id);
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
  clear() {
    while (!Object.is(this.startMarker.nextSibling, this.endMarker)) {
      if (this.startMarker.nextSibling == null)
        throw Error("End marker not found as subsequent document sibling as start marker");
      this.startMarker.nextSibling.remove();
    }
  }
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
var RecordMutation = Symbol("RecordMutation");
var TrackerOf = Symbol("TrackerOf");
var ProxyOf = Symbol("ProxyOf");
var RecordDependency = Symbol("RecordDependency");
var GetOriginal = Symbol("GetOriginal");
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
function makeProxyHandler(model2, tracker) {
  function getOrdinary(target, name, receiver) {
    if (name === TrackerOf)
      return tracker;
    if (name === GetOriginal)
      return target;
    tracker[RecordDependency](createOrRetrievePropRef(target, name));
    let result = Reflect.get(target, name, receiver);
    if (typeof result === "object" && !isTracked(result)) {
      const original = result;
      const handler = makeProxyHandler(original, tracker);
      result = target[name] = new Proxy(original, handler);
      linkProxyToObject(original, result);
    }
    if (typeof result === "function" && tracker.options.autoTransactionalize && name !== "constructor") {
      let proxyWrapped2 = function() {
        const autoTransaction = tracker.startTransaction(original.name ?? "auto");
        try {
          const result2 = original.apply(receiver, arguments);
          if (autoTransaction.operations.length > 0) {
            tracker.commit(autoTransaction);
          } else {
            tracker.rollback(autoTransaction);
          }
          return result2;
        } catch (er) {
          tracker.rollback(autoTransaction);
          throw er;
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
    if (typeof newValue === "object" && !newValue[TrackerOf]) {
      const handler = makeProxyHandler(newValue, tracker);
      newValue = new Proxy(newValue, handler);
    }
    const mutation = name in target ? { type: "change", target, name, oldValue: model2[name], newValue } : { type: "create", target, name, newValue };
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
    const mutation = { type: "delete", target, name, oldValue: model2[name] };
    const wasDeleted = Reflect.deleteProperty(target, name);
    if (wasDeleted) {
      tracker[RecordMutation](mutation);
    }
    return wasDeleted;
  }
  let set = setOrdinary, get = getOrdinary;
  if (Array.isArray(model2)) {
    set = setArray;
    if (tracker.options.trackHistory)
      get = getArrayTransactionShim;
  }
  if (isArguments(model2))
    throw Error("Tracking of exotic arguments objects not supported");
  return { get, set, deleteProperty };
}
function isTracked(obj) {
  return typeof obj === "object" && !!obj[TrackerOf];
}
var PropReference = class {
  object;
  prop;
  #subscribers = /* @__PURE__ */ new Set();
  #notifying = false;
  constructor(object, prop) {
    if (!isTracked(object) && object[ProxyOf]) {
      object = object[ProxyOf];
    }
    this.object = object;
    this.prop = prop;
  }
  subscribe(callback) {
    this.#subscribers.add(callback);
    return { dispose: this.#subscribers.delete.bind(this.#subscribers, callback) };
  }
  notifySubscribers() {
    if (this.#notifying)
      console.warn(`Re-entrant property subscription for '${String(this.prop)}'`);
    this.#notifying = true;
    for (const callback of [...this.#subscribers])
      callback();
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
      const propSubscription = propRef.subscribe(this.notifySubscribers.bind(this));
      this.#trackedProperties.set(propRef, propSubscription);
    }
  }
  subscribe(callback) {
    this.#subscribers.add(callback);
    return { dispose: () => this.#subscribers.delete(callback) };
  }
  notifySubscribers() {
    for (const callback of [...this.#subscribers])
      callback();
  }
  endDependencyTrack() {
    this.#tracker.endDependencyTrack(this);
  }
  /** Indicates that this dependency list is dependent on *all* tracked changes */
  trackAllChanges() {
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
var defaultTrackerOptions = {
  trackHistory: true,
  autoTransactionalize: true,
  deferNotifications: false,
  compactOnCommit: true
};
var Tracker = class {
  #subscribers = /* @__PURE__ */ new Set();
  #transaction;
  #rootTransaction;
  #redos = [];
  options;
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
      this.#rootTransaction = this.#transaction = { type: "transaction", operations: [] };
    }
    this.options = Object.freeze(appliedOptions);
  }
  // turn on change tracking
  // returns a proxied model object, and tracker to control history
  track(model2) {
    if (isTracked(model2))
      throw Error("Object already tracked");
    const proxied = new Proxy(model2, makeProxyHandler(model2, this));
    Object.defineProperty(model2, ProxyOf, {
      enumerable: false,
      writable: true,
      configurable: false
    });
    model2[ProxyOf] = proxied;
    return proxied;
  }
  trackAsReadonlyDeep(model2) {
    return this.track(model2);
  }
  subscribe(callback) {
    this.#subscribers.add(callback);
    return { dispose: () => this.#subscribers.delete(callback) };
  }
  #notifySubscribers(mutation) {
    if (this.options.deferNotifications) {
      for (const sub of this.#subscribers)
        queueMicrotask(() => sub(mutation));
    } else {
      for (const sub of this.#subscribers)
        sub(mutation);
    }
  }
  #ensureHistory() {
    if (!this.#transaction)
      throw Error("History tracking disabled.");
    return this.#transaction;
  }
  get history() {
    this.#ensureHistory();
    this.#dependencyTrackers[0]?.trackAllChanges();
    this.#historyPropRef ??= createOrRetrievePropRef(this, "history");
    if (!this.#rootTransaction)
      throw Error("History tracking enabled, but no root transaction. Probably mutraction internal error.");
    return this.#rootTransaction.operations;
  }
  /** add another transaction to the stack  */
  startTransaction(name) {
    const transaction = this.#ensureHistory();
    this.#transaction = { type: "transaction", parent: transaction, operations: [] };
    if (name)
      this.#transaction.transactionName = name;
    return this.#transaction;
  }
  /** resolve and close the most recent transaction
    * throws if no transactions are active
    */
  commit(transaction) {
    const actualTransaction = this.#ensureHistory();
    if (transaction && transaction !== actualTransaction)
      throw Error("Attempted to commit wrong transaction. Transactions must be resolved in stack order.");
    if (!actualTransaction.parent)
      throw Error("Cannot commit root transaction");
    if (this.options.compactOnCommit)
      compactTransaction(actualTransaction);
    const parent = actualTransaction.parent;
    parent.operations.push(actualTransaction);
    actualTransaction.parent = void 0;
    this.#transaction = parent;
    if (this.#transaction.parent == null) {
      this.#notifySubscribers(void 0);
    }
  }
  /** undo all operations done since the beginning of the most recent trasaction
   * remove it from the transaction stack
   * if no transactions are active, undo all mutations
   */
  rollback(transaction) {
    const actualTransaction = this.#ensureHistory();
    if (transaction && transaction !== actualTransaction)
      throw Error("Attempted to commit wrong transaction. Transactions must be resolved in stack order.");
    while (actualTransaction.operations.length)
      this.undo();
    this.#transaction = actualTransaction.parent ?? actualTransaction;
  }
  /** undo last mutation or transaction and push into the redo stack  */
  undo() {
    const transaction = this.#ensureHistory();
    const mutation = transaction.operations.pop();
    if (!mutation)
      return;
    this.#undoOperation(mutation);
    this.#redos.unshift(mutation);
    this.#historyPropRef?.notifySubscribers();
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
      this.#notifySubscribers(mutation);
    }
  }
  /** repeat last undone mutation  */
  redo() {
    const transaction = this.#ensureHistory();
    const mutation = this.#redos.shift();
    if (!mutation)
      return;
    this.#redoOperation(mutation);
    transaction.operations.push(mutation);
    this.#historyPropRef?.notifySubscribers();
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
      this.#notifySubscribers(mutation);
    }
  }
  /** clear the redo stack */
  // any direct mutation implicitly does this
  clearRedos() {
    this.#redos.length = 0;
  }
  clearHistory() {
    const transaction = this.#ensureHistory();
    transaction.parent = void 0;
    transaction.operations.length = 0;
    this.clearRedos();
    this.#notifySubscribers(void 0);
  }
  /** record a mutation, if you have the secret key  */
  [RecordMutation](mutation) {
    this.#transaction?.operations.push(Object.freeze(mutation));
    this.clearRedos();
    createOrRetrievePropRef(mutation.target, mutation.name).notifySubscribers();
    this.#notifySubscribers(mutation);
    this.#historyPropRef?.notifySubscribers();
  }
  #dependencyTrackers = [];
  startDependencyTrack() {
    let deps = new DependencyList(this);
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
function track(model2) {
  return defaultTracker.track(model2);
}
var suppress = { suppressUntrackedWarning: true };
function effectDefault(sideEffect) {
  effect(defaultTracker, sideEffect, suppress);
}
function ForEachPersist(array, map) {
  const result = new ElementSpan();
  const containers = [];
  const outputMap = /* @__PURE__ */ new WeakMap();
  effectDefault(() => {
    for (let i = containers.length; i < array.length; i++) {
      const container = new ElementSpan();
      containers.push(container);
      effectDefault((dep) => {
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
      });
      result.append(container.removeAsFragment());
    }
    while (containers.length > array.length) {
      containers.pop().removeAsFragment();
    }
  });
  return result.removeAsFragment();
}
function element(name, staticAttrs, dynamicAttrs, ...children) {
  const el = document.createElement(name);
  let syncEvents;
  for (let [name2, value] of Object.entries(staticAttrs)) {
    switch (name2) {
      case "mu:syncEvent":
        syncEvents = value;
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
  el.append(...children);
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
  let node = getMarker("placeholder");
  effectDefault(() => {
    const newNode = document.createTextNode(String(getter() ?? ""));
    node.replaceWith(newNode);
    node = newNode;
  });
  return node;
}
function memoize(getter) {
  let isResolved = false;
  let value = void 0;
  function resolveLazy() {
    return isResolved ? value : (isResolved = true, value = getter());
  }
  return resolveLazy;
}
var suppress2 = { suppressUntrackedWarning: true };
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
    const empty = getMarker("if:anti-consequent");
    lazyChoices.push({ nodeGetter: () => empty });
  }
  let current = getMarker("choice-placeholder");
  effect(defaultTracker, () => {
    for (const { nodeGetter, conditionGetter } of choices) {
      if (!conditionGetter || conditionGetter()) {
        const newNode = nodeGetter();
        current.replaceWith(newNode);
        current = newNode;
        break;
      }
    }
  }, suppress2);
  return current;
}
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
        return;
      }
    }
    container.emptyAsFragment();
  }
  window.addEventListener("hashchange", (ev) => hashChangeHandler(ev.newURL));
  hashChangeHandler(location.href);
  return container.removeAsFragment();
}

// out2/todo.js
function makeItem(title) {
  return {
    title,
    done: false,
    editing: false
  };
}
var model = track({
  newItemTitle: "",
  items: []
});
function remove(item) {
  const idx = model.items.indexOf(item);
  if (idx >= 0)
    model.items.splice(idx, 1);
}
function itemRender(item) {
  var _frag2;
  const editor = element("input", {}, {
    value: () => item.title
  });
  return _frag2 = document.createDocumentFragment(), _frag2.append("", choose({
    nodeGetter: () => element("li", {}, {}, "", child(() => editor), "", element("button", {}, {
      onclick: () => () => (item.title = editor.value, item.editing = false)
    }, "\u2705"), "", element("button", {}, {
      onclick: () => () => item.editing = false
    }, "\u274C"), ""),
    conditionGetter: () => !item.editing
  }, {
    nodeGetter: () => element("li", {}, {}, "", element("button", {}, {
      onclick: () => () => remove(item)
    }, "\u274C"), "", element("button", {}, {
      onclick: () => () => item.editing = true
    }, "\u270F\uFE0F"), "", element("label", {}, {}, "", element("input", {
      type: "checkbox"
    }, {
      checked: () => item.done,
      onchange: () => (ev) => item.done = ev.target.checked
    }), "", element("span", {}, {
      style: () => ({
        textDecoration: item.done ? "line-through" : "none"
      })
    }, child(() => item.title)), ""), "")
  }), "", ""), _frag2;
}
function doAdd(ev) {
  model.items.push(makeItem(model.newItemTitle));
  model.newItemTitle = "";
  ev.preventDefault();
}
function sort() {
  model.items.sort((a, b) => Number(a.done) - Number(b.done));
}
var todoApp = element("div", {}, {}, "", element("h1", {}, {
  title: () => model.newItemTitle
}, "To-do"), "", element("button", {}, {
  onclick: () => sort
}, "Sort by unfinished"), "", element("ul", {}, {}, "", child(() => ForEachPersist(model.items, (item) => itemRender(item))), ""), "", element("form", {}, {
  onsubmit: () => doAdd
}, "", element("label", {}, {}, "New item ", element("input", {}, {
  value: () => model.newItemTitle,
  oninput: () => (ev) => model.newItemTitle = ev.target.value
}), ""), "", element("button", {}, {}, "New item"), ""), "", element("a", {
  href: "#about"
}, {}, "About"), "");

// out2/mulogo.js
function muLogo(size) {
  const treads = 32;
  let stops = "";
  for (let i = 0; i < treads; i++) {
    const color = i % 2 ? "#0000" : "#000";
    stops += `
 , ${color} ${i / treads}turn, ${color} ${(i + 1) / treads}turn`;
  }
  const logoStyles = {
    position: "relative",
    width: `${size}px`,
    height: `${size}px`,
    display: "inline-block"
  };
  const treadStyles = {
    position: "absolute",
    display: "inline-block",
    width: "100%",
    height: "100%",
    borderRadius: "100%",
    background: `
            radial-gradient(#fff 40%, #000 41%, #000 63%, #0000 64%),
            conic-gradient(from 90deg at 50% 50%
            ${stops}`,
    animation: "rotating 20s linear infinite"
  };
  const muStyles = {
    position: "relative",
    left: "26%",
    top: "41%",
    color: "var(--primary-color)",
    font: `italic bold ${size * 0.8}px "Calibri", "Arial", "Helvetica", sans-serif`,
    lineHeight: "0"
  };
  return element("div", {}, {
    style: () => logoStyles
  }, "", element("div", {}, {
    style: () => treadStyles
  }), "", element("div", {
    className: "primary"
  }, {
    style: () => muStyles
  }, "\u03BC"), "");
}

// out2/binding.js
function binding() {
  var _frag2;
  const model2 = track({
    text: "initial",
    scrollPos: 0
  });
  return _frag2 = document.createDocumentFragment(), _frag2.append("", element("div", {}, {}, "", element("input", {
    ["mu:syncEvent"]: "input"
  }, {
    maxLength: () => 10,
    value: () => model2.text
  }), "", element("input", {
    ["mu:syncEvent"]: "input"
  }, {
    maxLength: () => 10,
    value: () => model2.text
  }), "", element("input", {}, {
    maxLength: () => 10,
    value: () => model2.text
  }), "", element("input", {
    ...{
      value: model2.text
    }
  }, {
    maxLength: () => 10
  }), ""), "", element("div", {}, {}, "Scroll pos: ", child(() => model2.scrollPos)), "", element("div", {
    ["mu:syncEvent"]: "scroll"
  }, {
    scrollTop: () => model2.scrollPos,
    style: () => ({
      overflow: "scroll",
      maxHeight: "100px"
    })
  }, "", element("div", {}, {
    style: () => ({
      height: "200px"
    })
  }), ""), ""), _frag2;
}

// out2/codesample.js
function dedent(s) {
  const prefix = /\n[ \t]*$/.exec(s);
  return s.replaceAll(prefix[0], "\n").trim();
}
function codeSample(code, output) {
  return element("figure", {}, {}, "", element("code", {}, {}, child(() => dedent(code))), "", choose({
    nodeGetter: () => element("output", {}, {}, child(() => output)),
    conditionGetter: () => output != null
  }), "");
}

// out2/intro.js
function intro() {
  const model2 = track({
    clicks: 0
  });
  const app2 = element("button", {}, {
    onclick: () => () => ++model2.clicks
  }, "", child(() => model2.clicks), " clicks");
  return element("div", {}, {}, "", element("hgroup", {}, {}, "", element("h1", {}, {}, "Mutraction"), "", element("h2", {}, {}, "Reactive UI in Typescript and JSX"), ""), "", element("p", {}, {}, "Mutraction automatically updates DOM elements when needed.\n            It tracks changes made using normal property assignment and mutations such as ", element("code", {}, {}, "[].push()"), ".\n            The entry point is the ", element("code", {}, {}, "track()"), " function.\n            After that, you can reference the tracked object in JSX expressions.\n            JSX expressions produce real DOM elements that you can insert directly into the document."), "", child(() => codeSample(`
            const model = track({ clicks: 0});
            const app = (
                <button onclick={() => ++model.clicks }>
                    { model.clicks } clicks
                </button>
            );

            document.body.append(app);
            `, app2)), "");
}

// out2/getStarted.js
function getStarted() {
  var _frag2;
  return _frag2 = document.createDocumentFragment(), _frag2.append("", element("h1", {}, {}, "Getting Started"), "", element("p", {}, {}, "To get started, you'll need a current ", element("a", {
    href: "https://nodejs.org/"
  }, {}, "NPM"), " installed.\n                Then run these in an empty directory."), "", child(() => codeSample(`
                npx degit github:tomtheisen/mutraction/mutraction-dom-template
                npm install
                npm run build
                `)), "", element("p", {}, {}, "Then open up ", element("code", {}, {}, "index.html"), " right from the file system.\n                No fancy servers or whatever."), ""), _frag2;
}

// out2/index.js
var _frag;
var _frag4;
var about = (_frag = document.createDocumentFragment(), _frag.append("", element("h1", {}, {}, "About"), "", element("p", {}, {}, "This is all about the stuff."), ""), _frag);
var router = Router({
  pattern: "#start",
  element: getStarted()
}, {
  pattern: "#about",
  element: about
}, {
  pattern: "#todo",
  element: todoApp
}, {
  pattern: /#id=(\d+)/,
  element: (match) => {
    var _frag2;
    return _frag2 = document.createDocumentFragment(), _frag2.append("You can match: ", child(() => match[1])), _frag2;
  }
}, {
  pattern: "#2way",
  element: binding()
}, {
  pattern: /#.+/,
  element: (match) => {
    var _frag3;
    return _frag3 = document.createDocumentFragment(), _frag3.append("No route found for ", child(() => match[0])), _frag3;
  }
}, {
  element: intro
});
var app = (_frag4 = document.createDocumentFragment(), _frag4.append("", element("header", {}, {}, "", element("div", {}, {
  style: () => ({
    position: "relative",
    top: "4px"
  })
}, child(() => muLogo(50))), "", element("h1", {}, {}, "traction"), "", element("a", {
  href: "https://github.com/tomtheisen/mutraction"
}, {}, element("img", {
  src: "assets/github-logo.svg"
}, {
  style: () => ({
    height: "34px"
  })
})), ""), "", element("div", {
  className: "layout"
}, {}, "", element("nav", {}, {}, "", element("ul", {}, {
  style: () => ({
    position: "sticky",
    top: "1em",
    paddingLeft: "0"
  })
}, "", element("li", {}, {}, element("a", {
  href: "#"
}, {}, "Introduction")), "", element("li", {}, {}, element("a", {
  href: "#start"
}, {}, "Getting Started")), "", element("li", {}, {}, "", element("details", {}, {
  open: () => true
}, "", element("summary", {}, {}, element("a", {}, {}, "Topics")), "", element("ul", {}, {}, "", element("li", {}, {}, "Model tracking"), "", element("li", {}, {}, "Dependencies"), "", element("li", {}, {}, "Property references"), "", element("li", {}, {}, "2-way binding"), ""), ""), ""), "", element("li", {}, {}, "", element("details", {}, {
  open: () => true
}, "", element("summary", {}, {}, element("a", {}, {}, "Reference")), "", element("ul", {}, {}, "", element("li", {}, {}, "mu:if / mu:else"), "", element("li", {}, {}, "mu:syncEvent"), "", element("li", {}, {}, "Property references"), "", element("li", {}, {}, "ForEach / ForEachPersist"), "", element("li", {}, {}, "track"), "", element("li", {}, {}, "Tracker"), "", element("li", {}, {}, "effect"), "", element("li", {}, {}, "Router"), ""), ""), ""), "", element("li", {}, {}, element("a", {
  href: "#"
}, {}, "Introduction")), "", element("li", {}, {}, element("a", {
  href: "#"
}, {}, "Introduction")), "", element("li", {}, {}, element("a", {
  href: "#about"
}, {}, "About")), "", element("li", {}, {}, element("a", {
  href: "#todo"
}, {}, "To-do")), "", element("li", {}, {}, element("a", {
  href: "#2way"
}, {}, "Two way")), "", element("li", {}, {}, element("a", {
  href: "#id=234"
}, {}, "Lookup")), ""), ""), "", element("main", {}, {}, "", element("div", {}, {
  style: () => ({
    maxWidth: "960px",
    margin: "0 auto"
  })
}, "", child(() => router), ""), ""), ""), ""), _frag4);
document.body.append(app);
