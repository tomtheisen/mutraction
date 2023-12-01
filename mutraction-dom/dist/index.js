// out/symbols.js
var RecordMutation = Symbol("RecordMutation");
var TrackerOf = Symbol("TrackerOf");
var ProxyOf = Symbol("ProxyOf");
var RecordDependency = Symbol("RecordDependency");
var GetOriginal = Symbol("GetOriginal");
var AccessPath = Symbol("AccessPath");
var ItemsSymbol = Symbol("items");

// out/proxy.set.js
function getSetProxyHandler(tracker) {
  return {
    get(target, name, receiver) {
      if (!(target instanceof Set))
        throw Error("Expected Set target in proxy.");
      const itemsPropRef = createOrRetrievePropRef(target, ItemsSymbol);
      switch (name) {
        case TrackerOf:
          return tracker;
        case GetOriginal:
          return target;
        case "size":
          tracker[RecordDependency](itemsPropRef);
          return target.size;
        case "has":
        case "entries":
        case "keys":
        case "values":
        case "forEach":
        case Symbol.iterator:
          return function setProxy() {
            tracker[RecordDependency](itemsPropRef);
            return target[name](...arguments);
          };
        case "add":
          return function add(value) {
            value = maybeGetProxy(value, tracker) ?? value;
            setAccessPath(value, getAccessPath(target), "\u2203");
            if (target.has(value))
              return;
            const result = target.add(value);
            tracker[RecordMutation]({ type: "setadd", name: ItemsSymbol, target, timestamp: /* @__PURE__ */ new Date(), newValue: value });
            return result;
          };
        case "delete":
          return function delete$(value) {
            value = maybeGetProxy(value, tracker) ?? value;
            if (!target.has(value))
              return;
            const result = target.delete(value);
            tracker[RecordMutation]({ type: "setdelete", name: ItemsSymbol, target, timestamp: /* @__PURE__ */ new Date(), oldValue: value });
            return result;
          };
        case "clear":
          return function clear() {
            if (target.size === 0)
              return;
            const oldValues = Array.from(target.values());
            target.clear();
            tracker[RecordMutation]({ type: "setclear", name: ItemsSymbol, target, timestamp: /* @__PURE__ */ new Date(), oldValues });
          };
        default:
          return Reflect.get(target, name, receiver);
      }
    }
  };
}

// out/proxy.map.js
function getMapProxyHandler(tracker) {
  return {
    get(target, name, receiver) {
      if (!(target instanceof Map))
        throw Error("Expected Map target in proxy.");
      const itemsPropRef = createOrRetrievePropRef(target, ItemsSymbol);
      switch (name) {
        case TrackerOf:
          return tracker;
        case GetOriginal:
          return target;
        case "size":
          tracker[RecordDependency](itemsPropRef);
          return target.size;
        case "has":
        case "keys":
        case "values":
        case "entries":
        case Symbol.iterator:
          return function mapProxy() {
            tracker[RecordDependency](itemsPropRef);
            return target[name](...arguments);
          };
        case "get":
          return function get(key) {
            tracker[RecordDependency](itemsPropRef);
            const result = target.get(key);
            if (typeof result === "object" && result && isTracked(result)) {
              setAccessPath(result, getAccessPath(target), `get(${key})`);
            }
            return result;
          };
        case "set":
          return function set(key, val) {
            assertSafeMapKey(key);
            const isChange = target.has(key);
            const oldValue = isChange && target.get(key);
            const proxy = maybeGetProxy(val, tracker);
            if (proxy) {
              setAccessPath(proxy, getAccessPath(target), `get(${key})`);
            }
            target.set(key, val = proxy ?? val);
            const mutation = isChange ? { target, name: ItemsSymbol, timestamp: /* @__PURE__ */ new Date(), type: "mapchange", key, newValue: val, oldValue } : { target, name: ItemsSymbol, timestamp: /* @__PURE__ */ new Date(), type: "mapcreate", key, newValue: val };
            tracker[RecordMutation](mutation);
            return receiver;
          };
        case "delete":
          return function delete$(key) {
            const oldValue = target.get(key);
            if (!target.delete(key))
              return false;
            const mutation = { target, name: ItemsSymbol, timestamp: /* @__PURE__ */ new Date(), type: "mapdelete", key, oldValue };
            tracker[RecordMutation](mutation);
            return true;
          };
        case "clear":
          return function clear() {
            const oldEntries = Array.from(target.entries());
            target.clear();
            const mutation = { target, name: ItemsSymbol, timestamp: /* @__PURE__ */ new Date(), type: "mapclear", oldEntries };
            tracker[RecordMutation](mutation);
          };
        default:
          return Reflect.get(target, name, receiver);
      }
    }
  };
}
function assertSafeMapKey(key) {
  if (key && typeof key === "object" && !Object.isFrozen(key)) {
    throw Error("In order to apply tracking proxy, Map keys must be immutable or frozen.");
  }
}

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
    configurable: false,
    value: proxy
  });
}
function getExistingProxy(value) {
  return value[ProxyOf];
}
var unproxyableConstructors = /* @__PURE__ */ new Set([RegExp, Promise]);
if ("window" in globalThis)
  unproxyableConstructors.add(globalThis.window.constructor);
function canBeProxied(val) {
  if (val == null)
    return false;
  if (typeof val !== "object")
    return false;
  if (isTracked(val))
    return false;
  if (!Object.isExtensible(val))
    return false;
  if (unproxyableConstructors.has(val.constructor))
    return false;
  return true;
}
function maybeGetProxy(value, tracker) {
  if (typeof value !== "object" || !value)
    return void 0;
  if (isTracked(value))
    return value;
  const existingProxy = getExistingProxy(value);
  if (existingProxy) {
    if (existingProxy[TrackerOf] !== tracker) {
      throw Error("Object cannot be tracked by multiple tracker instances");
    }
    return existingProxy;
  }
  if (canBeProxied(value))
    return tracker.track(value);
}
function getAccessPath(obj) {
  return obj[AccessPath];
}
function setAccessPath(obj, parentPath, leafSegment) {
  const fullPath = parentPath ? parentPath + "." + String(leafSegment) : String(leafSegment);
  Object.assign(obj, { [AccessPath]: fullPath });
}
function makeProxyHandler(model, tracker) {
  if (!canBeProxied(model))
    throw Error("This object type cannot be proxied");
  if (model instanceof Set)
    return getSetProxyHandler(tracker);
  if (model instanceof Map)
    return getMapProxyHandler(tracker);
  function getOrdinary(target, name, receiver) {
    if (name === TrackerOf)
      return tracker;
    if (name === GetOriginal)
      return target;
    if (name === AccessPath)
      return target[name];
    tracker[RecordDependency](createOrRetrievePropRef(target, name));
    let result = Reflect.get(target, name, receiver);
    if (result && typeof result === "object" && isDebugMode) {
      setAccessPath(result, getAccessPath(target), name);
    }
    const maybeProxy = maybeGetProxy(result, tracker);
    if (maybeProxy) {
      result = target[name] = maybeProxy;
    } else if (typeof result === "function" && tracker.options.autoTransactionalize && name !== "constructor") {
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
    if (name === AccessPath) {
      return Reflect.set(target, AccessPath, newValue);
    }
    if (newValue && typeof newValue === "object" && isDebugMode) {
      setAccessPath(newValue, getAccessPath(target), name);
    }
    newValue = maybeGetProxy(newValue, tracker) ?? newValue;
    const mutation = name in target ? { type: "change", target, name, oldValue: model[name], newValue, timestamp: /* @__PURE__ */ new Date() } : { type: "create", target, name, newValue, timestamp: /* @__PURE__ */ new Date() };
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
          removed,
          timestamp: /* @__PURE__ */ new Date()
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
          newValue,
          timestamp: /* @__PURE__ */ new Date()
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
    const mutation = { type: "delete", target, name, oldValue: model[name], timestamp: /* @__PURE__ */ new Date() };
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

// out/liveCollection.js
var LiveCollection = class {
  /* upper bound for live object count */
  get sizeBound() {
    return this.#sizeBound;
  }
  #sizeBound = 0;
  get generation() {
    return this.#generation;
  }
  #generation = 0;
  items = /* @__PURE__ */ new Map();
  registry = new FinalizationRegistry((idx) => {
    --this.#sizeBound;
    this.items.delete(idx);
    ++this.#generation;
  });
  add(t) {
    this.registry.register(t, this.#sizeBound);
    this.items.set(this.#sizeBound++, new WeakRef(t));
    ++this.#generation;
  }
  *[Symbol.iterator]() {
    for (const ref of this.items.values()) {
      const t = ref.deref();
      if (t)
        yield t;
    }
  }
};

// out/propref.js
var allPropRefs = new LiveCollection();
function getAllPropRefs() {
  if (!allPropRefs)
    throw Error("Only allowed in debug mode");
  return allPropRefs;
}
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
    allPropRefs?.add(this);
  }
  subscribe(dependencyList) {
    this.#subscribers.add(dependencyList);
    return {
      dispose: () => this.#subscribers.delete(dependencyList)
    };
  }
  notifySubscribers() {
    if (this.#notifying)
      console.warn(`Re-entrant property subscription for '${String(this.prop)}'`);
    const subscriberSnapshot = Array.from(this.#subscribers);
    this.#notifying = true;
    for (const dep of subscriberSnapshot)
      dep.notifySubscribers(this);
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
  notifySubscribers(trigger) {
    const subscriberSnapshot = Array.from(this.#subscribers);
    for (const callback of subscriberSnapshot)
      callback(trigger);
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
      } else if (prevOp.type === "setadd" && currOp.type === "setdelete" && Object.is(prevOp.newValue, currOp.oldValue)) {
        operations.splice(--i, 2);
      } else if (prevOp.type === "setdelete" && currOp.type === "setadd" && Object.is(prevOp.oldValue, currOp.newValue)) {
        operations.splice(--i, 2);
      } else if (prevOp.type === "mapcreate" && currOp.type === "mapchange" && prevOp.key === currOp.key) {
        operations.splice(--i, 2, { ...prevOp, newValue: currOp.newValue });
      } else if (prevOp.type === "mapcreate" && currOp.type === "mapdelete" && prevOp.key === currOp.key) {
        operations.splice(--i, 2);
      } else if (prevOp.type === "mapchange" && currOp.type === "mapchange" && prevOp.key === currOp.key) {
        operations.splice(--i, 2, { ...currOp, newValue: currOp.newValue });
      } else if (prevOp.type === "mapchange" && currOp.type === "mapdelete" && prevOp.key === currOp.key) {
        operations.splice(--i, 2, { ...currOp, oldValue: prevOp.oldValue });
      } else if (prevOp.type === "mapdelete" && currOp.type === "mapcreate" && prevOp.key === currOp.key) {
        operations.splice(--i, 2, { ...currOp, ...prevOp, type: "mapchange" });
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
  #inUse = false;
  #dependencyTrackers = [];
  options = defaultTrackerOptions;
  // If defined this will be the prop reference for the "history" property of this Tracker instance
  // If so, it should be notified whenever the history is affected
  //      mutations outside of transactions
  //      non-nested transaction committed
  #historyPropRef;
  constructor(options = {}) {
    this.setOptions(options);
  }
  setOptions(options = {}) {
    if (this.#inUse)
      throw Error("Cannot change options for a tracker that has already started tracking");
    if (options.trackHistory === false) {
      options.compactOnCommit = false;
      options.autoTransactionalize ??= false;
    }
    const appliedOptions = { ...defaultTrackerOptions, ...options };
    if (appliedOptions.compactOnCommit && !appliedOptions.trackHistory) {
      throw Error("Option compactOnCommit requires option trackHistory");
    }
    if (appliedOptions.trackHistory) {
      this.#operationHistory = [];
    } else {
      this.#operationHistory = void 0;
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
    this.#inUse = true;
    prepareForTracking(model, this);
    const proxied = new Proxy(model, makeProxyHandler(model, this));
    linkProxyToObject(model, proxied);
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
    this.#transaction = { type: "transaction", parent: this.#transaction, operations: [], dependencies: /* @__PURE__ */ new Set(), timestamp: /* @__PURE__ */ new Date() };
    if (name)
      this.#transaction.transactionName = name;
    return this.#transaction;
  }
  /** resolve and close the most recent transaction
    * throws if no transactions are active
    */
  commit(transaction) {
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
      this.#operationHistory?.push(this.#transaction);
      const allDependencyLists = /* @__PURE__ */ new Set();
      for (const propRef of this.#transaction.dependencies) {
        for (const dependencyList of propRef.subscribers) {
          allDependencyLists.add(dependencyList);
        }
      }
      for (const depList of allDependencyLists) {
        depList.notifySubscribers();
      }
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
    if (transaction && transaction !== this.#transaction)
      throw Error("Attempted to commit wrong transaction. Transactions must be resolved in stack order.");
    if (this.#transaction) {
      while (this.#transaction.operations.length)
        this.undo();
      this.#transaction = this.#transaction.parent;
    } else {
      while (this.#operationHistory?.length)
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
        case "setadd":
          targetAny.delete(mutation.newValue);
          break;
        case "setdelete":
          targetAny.add(mutation.oldValue);
          break;
        case "setclear":
          mutation.oldValues.forEach(targetAny.add.bind(targetAny));
          break;
        case "mapcreate":
          targetAny.delete(mutation.key);
          break;
        case "mapchange":
        case "mapdelete":
          targetAny.set(mutation.key, mutation.oldValue);
          break;
        case "mapclear":
          mutation.oldEntries.forEach(([k, v]) => targetAny.set(k, v));
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
        case "setadd":
          targetAny.add(mutation.newValue);
          break;
        case "setdelete":
          targetAny.delete(mutation.oldValue);
          break;
        case "setclear":
          targetAny.clear();
          break;
        case "mapcreate":
        case "mapchange":
          targetAny.set(mutation.key, mutation.newValue);
          break;
        case "mapdelete":
          targetAny.delete(mutation.key);
          break;
        case "mapclear":
          targetAny.clear();
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
      if (isDebugMode)
        mutation.targetPath = getAccessPath(mutation.target);
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
  /** Run the callback without calling any subscribers */
  ignoreUpdates(callback) {
    const dep = this.startDependencyTrack();
    dep.active = false;
    callback();
    dep.endDependencyTrack();
  }
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
    if (this.#gettingPropRef) {
      this.#lastPropRef = propRef;
    } else {
      this.#dependencyTrackers[0]?.addDependency(propRef);
    }
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
function prepareForTracking(value, tracker) {
  if (value instanceof Set) {
    const snap = Array.from(value);
    for (const e of snap) {
      const proxy = getExistingProxy(e);
      if (proxy) {
        value.delete(e);
        value.add(proxy);
      } else if (canBeProxied(e)) {
        value.delete(e);
        value.add(tracker.track(e));
      }
    }
    ;
  } else if (value instanceof Map) {
    const snap = Array.from(value);
    for (const [k, v] of snap) {
      assertSafeMapKey(k);
      const proxy = getExistingProxy(v);
      if (proxy)
        value.set(k, proxy);
      else if (canBeProxied(v))
        value.set(k, tracker.track(v));
    }
  }
}

// out/debug.js
var debugModeKey = "mu:debugMode";
var debugUpdateDebounce = 250;
var historyDepth = 10;
var isDebugMode = "sessionStorage" in globalThis && !!sessionStorage.getItem(debugModeKey);
if ("sessionStorage" in globalThis) {
  let enableDebugMode = function() {
    sessionStorage.setItem(debugModeKey, "true");
    location.reload();
  }, disableDebugMode = function() {
    sessionStorage.removeItem(debugModeKey);
    location.reload();
  };
  enableDebugMode2 = enableDebugMode, disableDebugMode2 = disableDebugMode;
  Object.assign(window, { [Symbol.for("mutraction.debug")]: enableDebugMode });
  if (["localhost", "127.0.0.1", "[::1]"].includes(location.hostname) && !isDebugMode) {
    console.info(`[\xB5] Try the mutraction diagnostic tool.  This message is only shown from localhost, but the tool is always available.`);
    console.info("\xBB window[Symbol.for('mutraction.debug')]()");
  }
  if (isDebugMode) {
    let valueString = function(val) {
      if (Array.isArray(val))
        return `Array(${val.length})`;
      if (typeof val === "object")
        return "{ ... }";
      if (typeof val === "function")
        return val.name ? `${val.name}() { ... }` : "() => { ... }";
      return JSON.stringify(val);
    }, el = function(tag, styles, ...nodes) {
      const node = document.createElement(tag);
      node.style.all = "revert";
      Object.assign(node.style, styles);
      node.append(...nodes);
      return node;
    }, getNodeAndTextDependencies = function(node) {
      const textDeps = Array.from(node.childNodes).filter((n) => n instanceof Text).flatMap((n) => getNodeDependencies(n)).filter(Boolean).map((n) => n);
      return (getNodeDependencies(node) ?? []).concat(...textDeps);
    }, getPropRefListItem = function(propRef) {
      const objPath = getAccessPath(propRef.object);
      const fullPath = objPath ? objPath + "." + String(propRef.prop) : String(propRef.prop);
      const value = propRef.current;
      const serialized = valueString(value);
      const editable = !value || typeof value !== "object" && typeof value !== "function";
      const valueSpan = el("span", editable ? { cursor: "pointer", textDecoration: "underline" } : {}, serialized);
      const subCount = propRef.subscribers.size;
      const subCountMessage = `(${subCount} ${subCount === 1 ? "subscriber" : "subscribers"})`;
      const li = el("li", {}, el("code", {}, fullPath), ": ", valueSpan, " ", subCountMessage);
      if (editable)
        valueSpan.addEventListener("click", () => {
          const result = prompt(`Update ${String(propRef.prop)}`, serialized);
          try {
            if (result)
              propRef.current = JSON.parse(result);
            refreshPropRefList();
          } catch {
          }
        });
      return li;
    }, refreshPropRefList = function() {
      const propRefListItems = [];
      for (const propRef of allPropRefs2) {
        propRefListItems.push(getPropRefListItem(propRef));
      }
      propRefList.replaceChildren(...propRefListItems);
    }, startInspectPick = function() {
      inspectButton.disabled = true;
      inspectButton.textContent = "\u2026";
      inspectedName.textContent = "(choose)";
      let inspectedElement;
      let originalBoxShadow = "";
      function moveHandler(ev) {
        if (ev.target instanceof HTMLElement) {
          let target = ev.target;
          while (target && (getNodeAndTextDependencies(target)?.length ?? 0) === 0) {
            target = target.parentElement;
          }
          if (target != inspectedElement) {
            if (inspectedElement)
              inspectedElement.style.boxShadow = originalBoxShadow;
            originalBoxShadow = target?.style.boxShadow ?? "";
            if (target) {
              if (target.style.boxShadow)
                target.style.boxShadow += ", inset #f0f4 0 99vmax";
              else
                target.style.boxShadow += "inset #f0f4 0 99vmax";
            }
            inspectedElement = target;
          }
        }
        ev.stopPropagation();
      }
      document.addEventListener("mousemove", moveHandler, { capture: true });
      document.addEventListener("click", (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        inspectButton.disabled = false;
        inspectButton.textContent = "\u{1F50D}";
        document.removeEventListener("mousemove", moveHandler, { capture: true });
        if (inspectedElement) {
          inspectedElement.style.boxShadow = originalBoxShadow;
          inspectedName.textContent = inspectedElement.tagName.toLowerCase();
          const deps = getNodeAndTextDependencies(inspectedElement);
          const trackedProps = new Set(deps.flatMap((d) => d.trackedProperties));
          const trackedPropItems = [];
          for (const propRef of trackedProps) {
            trackedPropItems.push(getPropRefListItem(propRef));
          }
          inspectedPropList.replaceChildren(...trackedPropItems);
        } else {
          inspectedName.textContent = "(none)";
          inspectedPropList.replaceChildren();
        }
      }, { capture: true, once: true });
    }, clampIntoView = function() {
      const { x, y, width, height } = container.getBoundingClientRect();
      const top = Math.max(0, Math.min(window.innerHeight - height, y));
      const left = Math.max(0, Math.min(window.innerWidth - width, x));
      container.style.top = top + "px";
      container.style.left = left + "px";
    };
    valueString2 = valueString, el2 = el, getNodeAndTextDependencies2 = getNodeAndTextDependencies, getPropRefListItem2 = getPropRefListItem, refreshPropRefList2 = refreshPropRefList, startInspectPick2 = startInspectPick, clampIntoView2 = clampIntoView;
    const updateCallbacks = [];
    let handle = 0;
    queueMicrotask(() => {
      effect(function historyChanged() {
        defaultTracker.history.length;
        if (handle === 0) {
          handle = setTimeout(function updateDiagnostics() {
            for (const cb of updateCallbacks)
              cb();
            handle = 0;
          }, debugUpdateDebounce);
        }
      });
    });
    const container = el("div", {
      position: "fixed",
      top: "50px",
      left: "50px",
      width: "30em",
      height: "20em",
      resize: "both",
      minHeight: "1.6em",
      minWidth: "15em",
      zIndex: "2147483647",
      background: "#eee",
      color: "#123",
      boxShadow: "#000 0em 0.5em 1em",
      border: "solid #345 0.4em",
      fontSize: "16px",
      display: "flex",
      flexDirection: "column",
      overflow: "auto"
    });
    const toggle = el("button", { marginRight: "1em" }, "_");
    let minimized = false;
    toggle.addEventListener("click", (ev) => {
      if (minimized = !minimized) {
        container.style.maxHeight = "1.6em";
        container.style.maxWidth = "15em";
      } else {
        container.style.maxHeight = "";
        container.style.maxWidth = "";
      }
      clampIntoView();
    });
    const closeButton = el("button", { float: "right" }, "\xD7");
    closeButton.addEventListener("click", disableDebugMode);
    const head = el("div", {
      fontWeight: "bold",
      background: "#123",
      color: "#eee",
      padding: "0.1em 1em",
      cursor: "grab"
    }, closeButton, toggle, "\u03BC diagnostics");
    const effectDetails = el("div", { whiteSpace: "pre" });
    const effectCount = el("span", {}, "0");
    const effectSummary = el("details", { cursor: "pointer", marginBottom: "1em" }, el("summary", {}, el("strong", {}, "Active effects: "), effectCount), effectDetails);
    let activeEffectsGeneration2 = -1;
    updateCallbacks.push(() => {
      let { activeEffects: activeEffects2, generation } = getActiveEffects();
      if (generation !== activeEffectsGeneration2) {
        activeEffectsGeneration2 = generation;
        effectDetails.innerText = [...activeEffects2.entries()].map((e) => `${e[0]}\xD7${e[1]}`).join("\n");
        effectCount.innerText = String(Array.from(activeEffects2.values()).reduce((a, b) => a + b, 0));
      }
    });
    const undoButton = el("button", {}, "Undo");
    const redoButton = el("button", {}, "Redo");
    queueMicrotask(() => {
      const { trackHistory } = defaultTracker.options;
      if (!trackHistory)
        undoButton.disabled = redoButton.disabled = true;
    });
    const history = defaultTracker.history;
    const historyCount = el("span", {}, "0");
    const historyList = el("ol", {});
    const historySummary = el("details", { cursor: "pointer", marginBottom: "1em" }, el("summary", {}, el("strong", {}, "Recent history: "), historyCount, " total ", undoButton, redoButton), historyList);
    undoButton.addEventListener("click", () => defaultTracker.undo());
    redoButton.addEventListener("click", () => defaultTracker.redo());
    updateCallbacks.push(() => {
      historyCount.innerText = String(history.length);
      const items = history.slice(-historyDepth).map(describeMutation).map((desc) => el("li", {}, desc));
      historyList.replaceChildren(...items);
    });
    const propRefCountNumber = el("span", {}, "0");
    const allPropRefs2 = getAllPropRefs();
    const propRefRefreshButton = el("button", {}, "\u21BB");
    propRefRefreshButton.addEventListener("click", refreshPropRefList);
    const propRefList = el("ol", {});
    const propRefSummary = el("details", {}, el("summary", { cursor: "pointer" }, el("strong", {}, "Live PropRefs: "), propRefCountNumber, " ", propRefRefreshButton), propRefList);
    let seenGeneration = -1;
    updateCallbacks.push(() => {
      if (allPropRefs2.generation !== seenGeneration) {
        propRefCountNumber.replaceChildren(String(allPropRefs2.sizeBound));
        refreshPropRefList();
        seenGeneration = allPropRefs2.generation;
      }
    });
    const inspectButton = el("button", {}, "\u{1F50D}");
    inspectButton.addEventListener("click", startInspectPick);
    const inspectedName = el("span", {}, "(none)");
    const inspectedPropList = el("ol", {});
    const content = el("div", { padding: "1em", overflow: "auto" }, inspectButton, " ", el("strong", {}, "Inspected node:"), " ", inspectedName, inspectedPropList, effectSummary, historySummary, propRefSummary);
    container.append(head, content);
    document.body.append(container);
    let xOffset = 0, yOffset = 0;
    head.addEventListener("mousedown", (ev) => {
      const rect = container.getBoundingClientRect();
      xOffset = ev.x - rect.x;
      yOffset = ev.y - rect.y;
      window.addEventListener("mousemove", moveHandler);
      document.body.addEventListener("mouseup", upHandler, { once: true });
      ev.preventDefault();
      function upHandler(ev2) {
        window.removeEventListener("mousemove", moveHandler);
      }
      function moveHandler(ev2) {
        const buttonPressed = (ev2.buttons & 1) > 0;
        if (buttonPressed) {
          container.style.left = ev2.x - xOffset + "px";
          container.style.top = ev2.y - yOffset + "px";
          clampIntoView();
        } else {
          window.removeEventListener("mousemove", moveHandler);
          window.removeEventListener("mouseup", upHandler);
        }
      }
    });
    window.addEventListener("resize", clampIntoView);
  }
}
var valueString2;
var el2;
var getNodeAndTextDependencies2;
var getPropRefListItem2;
var refreshPropRefList2;
var startInspectPick2;
var clampIntoView2;
var enableDebugMode2;
var disableDebugMode2;
function describeMutation(mut) {
  switch (mut.type) {
    case "transaction":
      return `Transaction ${mut.transactionName}`;
    case "create":
      return `Create property ${String(mut.name)}: ${mut.newValue}`;
    case "change":
      return `Modify property ${String(mut.name)}: ${mut.newValue}`;
    case "delete":
      return `Delete property ${String(mut.name)}`;
    case "arrayextend":
      return `Extend array to [${mut.newIndex}] = ${mut.newValue}`;
    case "arrayshorten":
      return `Shorten array to ${mut.newLength}`;
    case "setadd":
      return `Add to set: ${mut.newValue}`;
    case "setdelete":
      return `Delete from set: ${mut.oldValue}`;
    case "setclear":
      return `Clear set`;
    case "mapcreate":
      return `Add new entry to map [${mut.key}, ${mut.newValue}]`;
    case "mapchange":
      return `Change entry in map [${mut.key}, ${mut.newValue}]`;
    case "mapdelete":
      return `Remove key from map ${mut.key}`;
    case "mapclear":
      return `Clear map`;
    default:
      mut;
  }
  throw new Error("Function not implemented.");
}

// out/effect.js
var emptyEffect = { dispose: () => {
} };
var activeEffectsGeneration = 0;
var activeEffects = /* @__PURE__ */ new Map();
function recordActiveEffect(sideEffect) {
  const name = sideEffect.name || "(anonymous)";
  const current = activeEffects.get(name);
  if (current)
    activeEffects.set(name, current + 1);
  else
    activeEffects.set(name, 1);
  ++activeEffectsGeneration;
}
function removeActiveEffect(sideEffect) {
  const name = sideEffect.name || "(anonymous)";
  const current = activeEffects.get(name);
  if (!current || current <= 1)
    activeEffects.delete(name);
  else
    activeEffects.set(name, current - 1);
  ++activeEffectsGeneration;
}
function getActiveEffects() {
  return { activeEffects, generation: activeEffectsGeneration };
}
function effect(sideEffect, options = {}) {
  const { tracker = defaultTracker, suppressUntrackedWarning = false } = options;
  let dep = tracker.startDependencyTrack();
  let lastResult;
  try {
    lastResult = sideEffect(dep);
  } finally {
    dep.endDependencyTrack();
  }
  if (dep.trackedProperties.length === 0) {
    if (!suppressUntrackedWarning) {
      console.warn("effect() callback has no dependencies on any tracked properties.  It will not fire again.");
    }
    return emptyEffect;
  }
  if (isDebugMode)
    recordActiveEffect(sideEffect);
  let subscription = dep.subscribe(effectDependencyChanged);
  let disposed = false;
  let changing = false;
  function effectDispose() {
    if (disposed)
      console.error("Effect already disposed");
    disposed = true;
    dep.untrackAll();
    subscription.dispose();
    if (!changing && isDebugMode)
      removeActiveEffect(sideEffect);
  }
  ;
  function effectDependencyChanged(trigger) {
    if (typeof lastResult === "function")
      lastResult();
    changing = true;
    effectDispose();
    changing = disposed = false;
    dep = tracker.startDependencyTrack();
    lastResult = sideEffect(dep, trigger);
    dep.endDependencyTrack();
    subscription = dep.subscribe(effectDependencyChanged);
  }
  return { dispose: effectDispose };
}

// out/cleanup.js
var nodeCleanups = /* @__PURE__ */ new WeakMap();
function registerCleanup(node, subscription) {
  const cleanups = nodeCleanups.get(node);
  if (cleanups) {
    cleanups.push(subscription);
  } else {
    nodeCleanups.set(node, [subscription]);
  }
}
function cleanup(node) {
  const cleanups = nodeCleanups.get(node);
  cleanups?.forEach((s) => s.dispose());
  if (node instanceof Element) {
    node.childNodes.forEach(cleanup);
  }
}

// out/runtime.js
var suppress = { suppressUntrackedWarning: true };
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
var nodeDependencyMap = /* @__PURE__ */ new WeakMap();
function addNodeDependency(node, depList) {
  if (depList.trackedProperties.length === 0)
    return;
  let depLists = nodeDependencyMap.get(node);
  if (!depLists)
    nodeDependencyMap.set(node, depLists = []);
  depLists.push(depList);
}
function getNodeDependencies(node) {
  return nodeDependencyMap.get(node);
}
function element(tagName, staticAttrs, dynamicAttrs, ...children) {
  const el = document.createElement(tagName);
  el.append(...children);
  let syncEvents;
  for (let [name, value] of Object.entries(staticAttrs)) {
    switch (name) {
      case "mu:syncEvent":
        syncEvents = value;
        break;
      case "mu:apply":
        doApply(el, value);
        break;
      default:
        el[name] = value;
        break;
    }
  }
  const syncedProps = syncEvents ? [] : void 0;
  for (let [name, getter] of Object.entries(dynamicAttrs)) {
    if (syncedProps && name in el) {
      const propRef = defaultTracker.getPropRefTolerant(getter);
      if (propRef) {
        syncedProps.push([name, propRef]);
      }
    }
    switch (name) {
      case "style": {
        let updateStyle2 = function(dl) {
          Object.assign(el.style, getter());
          if (isDebugMode)
            addNodeDependency(el, dl);
        };
        var updateStyle = updateStyle2;
        const sub = effect(updateStyle2, suppress);
        registerCleanup(el, sub);
        break;
      }
      case "classList": {
        let updateClassList2 = function(dl) {
          const classMap = getter();
          for (const [name2, on] of Object.entries(classMap))
            el.classList.toggle(name2, !!on);
          if (isDebugMode)
            addNodeDependency(el, dl);
        };
        var updateClassList = updateClassList2;
        const sub = effect(updateClassList2, suppress);
        registerCleanup(el, sub);
        break;
      }
      default: {
        let updateAttribute2 = function(dl) {
          el[name] = getter();
          if (isDebugMode)
            addNodeDependency(el, dl);
        };
        var updateAttribute = updateAttribute2;
        const sub = effect(updateAttribute2, suppress);
        registerCleanup(el, sub);
        break;
      }
    }
  }
  if (syncEvents && syncedProps?.length) {
    for (const e of syncEvents.matchAll(/\S+/g)) {
      el.addEventListener(e[0], () => {
        for (const [name, propRef] of syncedProps)
          propRef.current = el[name];
      });
    }
  }
  return el;
}
function child(getter) {
  let node = document.createTextNode("");
  let sub = void 0;
  sub = effect(function childEffect(dl) {
    const val = getter();
    if (val instanceof Node) {
      dl.untrackAll();
      node = val;
    } else {
      const newNode = document.createTextNode(String(val ?? ""));
      if (sub)
        registerCleanup(newNode, sub);
      node.replaceWith(newNode);
      node = newNode;
      if (isDebugMode)
        addNodeDependency(node, dl);
    }
  }, suppress);
  registerCleanup(node, sub);
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
  /** replaces the interior contents of the span */
  replaceWith(...nodes) {
    this.emptyAsFragment();
    this.append(...nodes);
  }
  append(...nodes) {
    const frag = document.createDocumentFragment();
    frag.append(...nodes);
    if (!this.endMarker.parentNode)
      throw Error("End marker of ElementSpan has no parent");
    this.endMarker.parentNode.insertBefore(frag, this.endMarker);
  }
  registerCleanup(subscription) {
    registerCleanup(this.startMarker, subscription);
  }
  /** empties the contents of the span, and invokes cleanup on each child node */
  cleanup() {
    cleanup(this.startMarker);
    for (const node of this.emptyAsFragment().childNodes) {
      cleanup(node);
    }
  }
};

// out/types.js
function isNodeOptions(arg) {
  return arg != null && typeof arg === "object" && "node" in arg && arg.node instanceof Node;
}

// out/swapper.js
function Swapper(nodeFactory) {
  const span = new ElementSpan();
  const swapperSubscription = effect(function swapperEffect(dep) {
    for (const node of span.emptyAsFragment().childNodes) {
      cleanup(node);
    }
    const output = nodeFactory();
    if (isNodeOptions(output)) {
      span.replaceWith(output.node);
      return output.cleanup;
    } else if (output != null) {
      span.replaceWith(output);
      return;
    }
  });
  span.registerCleanup(swapperSubscription);
  return span.removeAsFragment();
}

// out/foreach.js
var suppress2 = { suppressUntrackedWarning: true };
function ForEach(array, map) {
  if (typeof array === "function")
    return Swapper(() => ForEach(array(), map));
  const result = new ElementSpan();
  const outputs = [];
  const arrayDefined = array ?? [];
  const lengthSubscription = effect(function forEachLengthEffect(lengthDep) {
    for (let i = outputs.length; i < arrayDefined.length; i++) {
      const output = { container: new ElementSpan() };
      outputs.push(output);
      output.subscription = effect(function forEachItemEffect(dep) {
        const item = arrayDefined[i];
        const projection = item !== void 0 ? map(item, i, arrayDefined) : document.createTextNode("");
        if (isNodeOptions(projection)) {
          output.container.replaceWith(projection.node);
          output.cleanup = projection.cleanup;
        } else if (projection != null) {
          output.container.replaceWith(projection);
          output.cleanup = void 0;
        }
        return () => {
          output.cleanup?.();
          output.container.cleanup();
        };
      }, suppress2);
      result.append(output.container.removeAsFragment());
    }
    while (outputs.length > arrayDefined.length) {
      cleanupOutput(outputs.pop());
    }
  }, suppress2);
  result.registerCleanup({ dispose() {
    outputs.forEach(cleanupOutput);
  } });
  result.registerCleanup(lengthSubscription);
  return result.removeAsFragment();
  function cleanupOutput({ cleanup: cleanup2, container, subscription }) {
    cleanup2?.();
    subscription?.dispose();
    container.removeAsFragment();
    container.cleanup();
  }
}
function ForEachPersist(array, map) {
  if (typeof array === "function")
    return Swapper(() => ForEachPersist(array(), map));
  const result = new ElementSpan();
  const outputs = [];
  const outputMap = /* @__PURE__ */ new WeakMap();
  const arrayDefined = array ?? [];
  const lengthSubscription = effect(function forEachPersistLengthEffect(lengthDep) {
    for (let i = outputs.length; i < arrayDefined.length; i++) {
      const output = { container: new ElementSpan() };
      outputs.push(output);
      output.subscription = effect(function forEachPersistItemEffect(dep) {
        const item = arrayDefined[i];
        if (item == null)
          return;
        if (typeof item !== "object")
          throw Error("Elements must be object in ForEachPersist");
        let newContents = outputMap.get(item);
        if (newContents == null) {
          if (dep)
            dep.active = false;
          try {
            const newNode = map(item);
            newContents = newNode instanceof HTMLElement ? newNode : new ElementSpan(newNode);
            outputMap.set(item, newContents);
          } finally {
            if (dep)
              dep.active = true;
          }
        } else {
          const connected = newContents instanceof HTMLElement ? newContents.isConnected : newContents.startMarker.isConnected;
          if (connected)
            console.error("ForEachPersist encountered the same object twice in the same array.");
        }
        if (newContents instanceof HTMLElement) {
          output.container.replaceWith(newContents);
        } else if (newContents != null) {
          output.container.replaceWith(newContents.removeAsFragment());
        }
        return () => output.container.emptyAsFragment();
      }, suppress2);
      result.append(output.container.removeAsFragment());
    }
    while (outputs.length > arrayDefined.length) {
      cleanupOutput(outputs.pop());
    }
  }, suppress2);
  result.registerCleanup({ dispose() {
    outputs.forEach(cleanupOutput);
  } });
  result.registerCleanup(lengthSubscription);
  return result.removeAsFragment();
  function cleanupOutput(output) {
    const { container, subscription } = output;
    subscription?.dispose();
    container.removeAsFragment();
    container.cleanup();
  }
}

// out/choose.js
var suppress3 = { suppressUntrackedWarning: true };
function getEmptyText() {
  return document.createTextNode("");
}
function choose(...choices) {
  let current;
  let currentNodeGetter;
  let conditionChanging = false;
  function dispose() {
    if (!conditionChanging)
      sub.dispose();
  }
  const sub = effect(function chooseEffect() {
    let newNodeGetter;
    for (const { nodeGetter, conditionGetter } of choices) {
      if (!conditionGetter || conditionGetter()) {
        newNodeGetter = nodeGetter;
        break;
      }
    }
    newNodeGetter ??= getEmptyText;
    if (newNodeGetter !== currentNodeGetter) {
      if (current) {
        conditionChanging = true;
        cleanup(current);
        conditionChanging = false;
      }
      currentNodeGetter = newNodeGetter;
      const newNode = currentNodeGetter();
      current?.replaceWith(newNode);
      registerCleanup(newNode, { dispose });
      current = newNode;
    }
  }, suppress3);
  if (!current)
    throw Error("Logical error in choose() for mu:if.  No element assigned after first effect invocation.");
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

// out/router.js
var fragmentMap = /* @__PURE__ */ new WeakMap();
function Router(...routes) {
  if (routes.some((route) => "pattern" in route && route.pattern instanceof RegExp && route.pattern.global))
    throw Error("Global-flagged route patterns not supported");
  const container = new ElementSpan();
  let lastResolvedSpan;
  let needsCleanup = false;
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
        if (needsCleanup) {
          lastResolvedSpan?.cleanup();
        } else {
          lastResolvedSpan?.removeAsFragment();
        }
        lastResolvedSpan = void 0;
        const { element: element2 } = route;
        needsCleanup = typeof element2 === "function";
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

// out/untrackedClone.js
function untrackedClone(obj, maxDepth = 10) {
  return untrackedCloneImpl(obj, maxDepth);
}
function untrackedCloneImpl(obj, maxDepth) {
  if (maxDepth < 0)
    throw Error("Maximum depth exceeded.  Maybe there's a reference cycle?");
  if (typeof obj !== "object")
    return obj;
  if (Array.isArray(obj)) {
    const result = obj.map((e) => untrackedCloneImpl(e, maxDepth - 1));
    return result;
  }
  if (obj.constructor && obj.constructor !== Object)
    throw Error("Can't clone objects with a prototype chain or instances of classes");
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, untrackedCloneImpl(v, maxDepth - 1)]));
}

// out/index.js
var version = "0.24.0";
export {
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
  untrackedClone,
  version
};
