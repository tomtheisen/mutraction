// out/effect.js
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

// out/config.js
function getConfig(name) {
  return document.querySelector(`meta[name=${name.replace(/\W/g, "\\$&")}]`)?.getAttribute("value") ?? void 0;
}
var showMarkers = !!getConfig("mu:show-markers");

// out/getMarker.js
function getMarker(mark) {
  return document.createTextNode(showMarkers ? `\u27EA${mark}\u27EB` : "");
}

// out/ElementSpan.js
var ElementSpan = class _ElementSpan {
  static id = 0;
  startMarker = getMarker("start:" + ++_ElementSpan.id);
  endMarker = getMarker("end:" + _ElementSpan.id);
  constructor(...node) {
    const frag = document.createDocumentFragment();
    frag.append(this.startMarker, ...node, this.endMarker);
  }
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

// out/runtime.js
var trackers = [];
function setTracker(newTracker) {
  if (trackers.length)
    throw Error("Nested dom tracking is not supported. Apply the tracker attribute at the top level of your application.");
  trackers.unshift(newTracker);
}
function clearTracker() {
  if (trackers.length === 0)
    throw Error("No tracker to clear");
  if (trackers.length > 1)
    throw Error("Internal error: too many trackers");
  trackers.unshift();
}
function effectOrDo(sideEffect) {
  const originalTracker = trackers[0];
  if (originalTracker) {
    let scopedEffect2 = function(dep) {
      trackers.unshift(originalTracker);
      sideEffect(dep);
      trackers.shift();
    };
    var scopedEffect = scopedEffect2;
    effect(originalTracker, scopedEffect2, { suppressUntrackedWarning: true });
  } else {
    sideEffect();
  }
}
function ForEach(array, map) {
  const result = new ElementSpan();
  const containers = [];
  effectOrDo((lengthDep) => {
    for (let i = containers.length; i < array.length; i++) {
      const container = new ElementSpan();
      containers.push(container);
      effectOrDo((itemDep) => {
        const newNode = map(array[i]);
        container.replaceWith(newNode);
      });
      result.append(container.removeAsFragment());
    }
    while (containers.length > array.length) {
      containers.pop().removeAsFragment();
    }
  });
  return result.removeAsFragment();
}
function ForEachPersist(array, map) {
  const capturedTracker = trackers;
  const result = new ElementSpan();
  const containers = [];
  const outputMap = /* @__PURE__ */ new WeakMap();
  effectOrDo(() => {
    const originalTracker = trackers;
    trackers = capturedTracker;
    for (let i = containers.length; i < array.length; i++) {
      const container = new ElementSpan();
      containers.push(container);
      effectOrDo((dep) => {
        const originalTracker2 = trackers;
        trackers = capturedTracker;
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
        trackers = originalTracker2;
      });
      result.append(container.removeAsFragment());
    }
    while (containers.length > array.length) {
      containers.pop().removeAsFragment();
    }
    trackers = originalTracker;
  });
  return result.removeAsFragment();
}
function element(name, staticAttrs, dynamicAttrs, ...children) {
  const el = document.createElement(name);
  for (let [name2, value] of Object.entries(staticAttrs ?? {})) {
    switch (name2) {
      case "mu:if":
        if (!value)
          return getMarker("optimized out");
        break;
      case "style":
        Object.assign(el.style, value);
        break;
      case "classList":
        const classMap = value;
        for (const e of Object.entries(classMap))
          el.classList.toggle(...e);
        break;
      default:
        el[name2] = value;
        break;
    }
  }
  let blank = void 0;
  for (let [name2, getter] of Object.entries(dynamicAttrs ?? {})) {
    const tracker = trackers[0];
    if (!tracker)
      throw Error("Cannot apply dynamic properties without scoped tracker");
    switch (name2) {
      case "mu:if":
        effectOrDo(() => {
          if (getter())
            blank?.replaceWith(el);
          else
            el.replaceWith(blank ??= getMarker("blank"));
        });
        break;
      case "style":
        effect(tracker, () => {
          Object.assign(el.style, getter());
        }, { suppressUntrackedWarning: true });
        break;
      case "classList":
        effect(tracker, () => {
          const classMap = getter();
          for (const e of Object.entries(classMap))
            el.classList.toggle(...e);
        }, { suppressUntrackedWarning: true });
        break;
      default:
        effect(tracker, () => {
          el[name2] = getter();
        }, { suppressUntrackedWarning: true });
        break;
    }
  }
  el.append(...children);
  return blank ?? el;
}
function child(getter) {
  const result = getter();
  if (result instanceof Node)
    return result;
  const tracker = trackers[0];
  if (tracker) {
    let node = getMarker("placeholder");
    effect(tracker, () => {
      const newNode = document.createTextNode(String(getter() ?? ""));
      node.replaceWith(newNode);
      node = newNode;
    }, { suppressUntrackedWarning: true });
    return node;
  } else {
    return document.createTextNode(String(getter() ?? ""));
  }
}

// out/symbols.js
var RecordMutation = Symbol("RecordMutation");
var TrackerOf = Symbol("TrackerOf");
var ProxyOf = Symbol("ProxyOf");
var RecordDependency = Symbol("RecordDependency");
var GetOriginal = Symbol("GetOriginal");

// out/propref.js
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
  autoTransactionalize: false,
  deferNotifications: false,
  compactOnCommit: true
};
var Tracker = class {
  #subscribers = /* @__PURE__ */ new Set();
  #transaction;
  #rootTransaction;
  #redos = [];
  options;
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
    if (this.#gettingPropRef)
      throw Error("Cannot be called re-entrantly.");
    this.#gettingPropRef = true;
    this.#lastPropRef = void 0;
    try {
      const actualValue = propGetter();
      if (!this.#lastPropRef)
        throw Error("No tracked properties.  Prop ref detection requires a tracked object.");
      const propRefCurrent = this.#lastPropRef.current;
      if (!Object.is(actualValue, propRefCurrent))
        console.error("The last operation of the callback must be a property get.\n`(foo || bar).quux` is allowed, but `foo.bar + 1` is not");
      return this.#lastPropRef;
    } finally {
      this.#gettingPropRef = false;
    }
  }
};

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
function makeProxyHandler(model, tracker) {
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
function track(model, options) {
  if (isTracked(model))
    throw Error("Object already tracked");
  const tracker = new Tracker(options);
  const proxied = new Proxy(model, makeProxyHandler(model, tracker));
  linkProxyToObject(model, proxied);
  return [proxied, tracker];
}
function trackAsReadonlyDeep(model, options) {
  return track(model, options);
}

// out/describe.js
function describeValue(val) {
  if (val === void 0)
    return "undefined";
  if (val === null)
    return "null";
  if (Array.isArray(val)) {
    if (val.length > 3) {
      return "[" + val.slice(0, 3).map(describeValue).join() + ", ...]";
    } else {
      return "[" + val.map(describeValue).join() + "]";
    }
  }
  if (typeof val === "object")
    return "{...}";
  if (typeof val === "string")
    return JSON.stringify(val);
  return String(val);
}
function describeMutation(mutation) {
  switch (mutation.type) {
    case "create":
      return `Create [${describeValue(mutation.name)}] = ${describeValue(mutation.newValue)}`;
    case "delete":
      return `Delete [${describeValue(mutation.name)}]`;
    case "change":
      return `Change [${describeValue(mutation.name)}] = ${describeValue(mutation.newValue)}`;
    case "arrayshorten":
      return `Shorten to length ${mutation.newLength}`;
    case "arrayextend":
      return `Extend to [${mutation.newIndex}] = ${describeValue(mutation.newValue)}`;
    case "transaction":
      const operationsDescription = mutation.operations.map(describeMutation).join(", ");
      if (mutation.transactionName) {
        return `Transaction ${mutation.transactionName}: [${operationsDescription}]`;
      } else {
        return `Transaction [${operationsDescription}]`;
      }
    default:
      mutation;
  }
  throw Error("unsupported mutation type");
}
export {
  DependencyList,
  ForEach,
  ForEachPersist,
  PropReference,
  Tracker,
  child,
  clearTracker,
  createOrRetrievePropRef,
  describeMutation,
  effect,
  element,
  isTracked,
  setTracker,
  track,
  trackAsReadonlyDeep
};
