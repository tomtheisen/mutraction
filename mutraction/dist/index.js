// out/src/symbols.js
var RecordMutation = Symbol("RecordMutation");
var TrackerOf = Symbol("TrackerOf");
var ProxyOf = Symbol("ProxyOf");
var RecordDependency = Symbol("RecordDependency");
var GetOriginal = Symbol("GetOriginal");

// out/src/dependency.js
var DependencyList = class {
  trackedProperties = /* @__PURE__ */ new Set();
  #tracker;
  #tracksAllChanges = false;
  constructor(tracker) {
    this.#tracker = tracker;
  }
  addDependency(propRef) {
    this.trackedProperties.add(propRef);
  }
  endDependencyTrack() {
    this.#tracker.endDependencyTrack(this);
  }
  /** Indicates that this dependency list is dependent on *all* tracked changes */
  trackAllChanges() {
    this.#tracksAllChanges = true;
  }
  getLatestChangeGeneration() {
    if (this.#tracksAllChanges)
      return this.#tracker.generation;
    let result = 0;
    for (let propRef of this.trackedProperties) {
      result = Math.max(result, propRef.generation);
    }
    return result;
  }
};

// out/src/compactTransaction.js
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

// out/src/propref.js
var SetGeneration = Symbol("SetGeneration");
var PropReference = class {
  object;
  prop;
  constructor(object, prop) {
    if (!isTracked(object) && object[ProxyOf]) {
      object = object[ProxyOf];
    }
    this.object = object;
    this.prop = prop;
  }
  get current() {
    return this.object[this.prop];
  }
  set current(newValue) {
    this.object[this.prop] = newValue;
  }
  #generation = 0;
  /** generation of last change */
  get generation() {
    return this.#generation;
  }
  [SetGeneration](value) {
    this.#generation = value;
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

// out/src/tracker.js
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
  #generation = 0;
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
    for (const dt of this.#dependencyTrackers) {
      dt.trackAllChanges();
    }
    if (!this.#rootTransaction)
      throw Error("History tracking enabled, but no root transaction. Probably mutraction internal error.");
    return this.#rootTransaction.operations;
  }
  get generation() {
    return this.#generation;
  }
  #advanceGeneration() {
    ++this.#generation;
  }
  // add another transaction to the stack
  startTransaction(name) {
    const transaction = this.#ensureHistory();
    this.#transaction = { type: "transaction", parent: transaction, operations: [] };
    if (name)
      this.#transaction.transactionName = name;
    return this.#transaction;
  }
  // resolve and close the most recent transaction
  // throws if no transactions are active
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
      this.#advanceGeneration();
      this.#notifySubscribers(void 0);
    }
  }
  // undo all operations done since the beginning of the most recent trasaction
  // remove it from the transaction stack
  // if no transactions are active, undo all mutations
  rollback(transaction) {
    const actualTransaction = this.#ensureHistory();
    if (transaction && transaction !== actualTransaction)
      throw Error("Attempted to commit wrong transaction. Transactions must be resolved in stack order.");
    let didSomething = false;
    while (actualTransaction.operations.length) {
      this.undo();
      didSomething = true;
    }
    this.#transaction = actualTransaction.parent ?? actualTransaction;
    if (didSomething)
      this.#advanceGeneration();
  }
  // undo last mutation or transaction and push into the redo stack
  undo() {
    const transaction = this.#ensureHistory();
    const mutation = transaction.operations.pop();
    if (!mutation)
      return;
    this.#advanceGeneration();
    this.#undoOperation(mutation);
    this.#redos.unshift(mutation);
  }
  #undoOperation(mutation) {
    if (mutation.type === "transaction") {
      for (let i = mutation.operations.length; i-- > 0; ) {
        this.#undoOperation(mutation.operations[i]);
      }
    } else {
      this.#setLastChangeGeneration(mutation);
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
  // repeat last undone mutation
  redo() {
    const transaction = this.#ensureHistory();
    const mutation = this.#redos.shift();
    if (!mutation)
      return;
    this.#advanceGeneration();
    this.#redoOperation(mutation);
    transaction.operations.push(mutation);
  }
  #redoOperation(mutation) {
    if (mutation.type === "transaction") {
      for (const operation of mutation.operations) {
        this.#redoOperation(operation);
      }
    } else {
      this.#setLastChangeGeneration(mutation);
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
  // clear the redo stack  
  // any direct mutation implicitly does this
  clearRedos() {
    this.#redos.length = 0;
  }
  clearHistory() {
    const transaction = this.#ensureHistory();
    transaction.parent = void 0;
    transaction.operations.length = 0;
    this.clearRedos();
    this.#advanceGeneration();
    this.#notifySubscribers(void 0);
  }
  // record a mutation, if you have the secret key
  [RecordMutation](mutation) {
    this.#transaction?.operations.push(Object.freeze(mutation));
    this.clearRedos();
    this.#advanceGeneration();
    this.#setLastChangeGeneration(mutation);
    this.#notifySubscribers(mutation);
  }
  #setLastChangeGeneration(mutation) {
    createOrRetrievePropRef(mutation.target, mutation.name)[SetGeneration](this.generation);
  }
  #dependencyTrackers = /* @__PURE__ */ new Set();
  startDependencyTrack() {
    let deps = new DependencyList(this);
    this.#dependencyTrackers.add(deps);
    return deps;
  }
  endDependencyTrack(dep) {
    const wasTracking = this.#dependencyTrackers.delete(dep);
    if (!wasTracking)
      throw Error("Dependency tracker was not active on this tracker");
    return dep;
  }
  [RecordDependency](propRef) {
    for (const dt of this.#dependencyTrackers) {
      dt.addDependency(propRef);
    }
    if (this.#gettingPropRef) {
      this.#lastPropRef = propRef;
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

// out/src/proxy.js
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
    if (initialSets == setsCompleted) {
      tracker[RecordMutation](mutation);
    }
    ++setsCompleted;
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
        tracker[RecordMutation](shorten);
        ++setsCompleted;
        return Reflect.set(target, name, newValue, receiver);
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
        tracker[RecordMutation](extension);
        ++setsCompleted;
        return Reflect.set(target, name, newValue, receiver);
      }
    }
    return setOrdinary(target, name, newValue, receiver);
  }
  function deleteProperty(target, name) {
    const mutation = { type: "delete", target, name, oldValue: model[name] };
    tracker[RecordMutation](mutation);
    return Reflect.deleteProperty(target, name);
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

// out/src/describe.js
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

// out/src/effect.js
function effect(tracker, sideEffect, options = {}) {
  let dep = tracker.startDependencyTrack();
  sideEffect();
  dep.endDependencyTrack();
  if (dep.trackedProperties.size === 0 && !options.suppressUntrackedWarning)
    console.warn("effect() callback has no dependencies on any tracked properties.  It will not fire again.");
  let latestGen = dep.getLatestChangeGeneration();
  function modelChangedForEffect() {
    const depgen = dep.getLatestChangeGeneration();
    if (depgen === latestGen)
      return;
    latestGen = depgen;
    dep = tracker.startDependencyTrack();
    sideEffect();
    dep.endDependencyTrack();
  }
  return tracker.subscribe(modelChangedForEffect);
}
export {
  PropReference,
  Tracker,
  createOrRetrievePropRef,
  describeMutation,
  effect,
  isTracked,
  track,
  trackAsReadonlyDeep
};
