// out/src/symbols.js
var RecordMutation = Symbol("RecordMutation");
var IsTracked = Symbol("IsTracked");
var RecordDependency = Symbol("RecordDependency");
var LastChangeGeneration = Symbol("LastChangeGeneration");

// out/src/dependency.js
var Dependency = class {
  trackedObjects = /* @__PURE__ */ new Set();
  #tracker;
  constructor(tracker) {
    this.#tracker = tracker;
  }
  addDependency(target) {
    this.trackedObjects.add(target);
  }
  endDependencyTrack() {
    this.#tracker.endDependencyTrack(this);
  }
  getLatestChangeGeneration() {
    let result = 0;
    for (let obj of this.trackedObjects) {
      result = Math.max(result, this.#tracker.getLastChangeGeneration(obj));
    }
    return result;
  }
};

// out/src/tracker.js
var HistorySentinel = {};
var defaultTrackerOptions = {
  trackHistory: true,
  autoTransactionalize: false
};
var Tracker = class {
  #subscribers = /* @__PURE__ */ new Set();
  #transaction;
  #rootTransaction;
  #redos = [];
  #generation = 0;
  options;
  constructor(options = {}) {
    const appliedOptions = { ...defaultTrackerOptions, ...options };
    if (appliedOptions.autoTransactionalize && !appliedOptions.trackHistory) {
      throw Error("Option autoTransactionalize requires option trackHistory");
    }
    if (appliedOptions.trackHistory) {
      this.#rootTransaction = this.#transaction = { type: "transaction", operations: [] };
    }
    this.options = Object.freeze(appliedOptions);
  }
  subscribe(callback) {
    this.#subscribers.add(callback);
    const dispose = () => this.#subscribers.delete(callback);
    return { dispose };
  }
  #notifySubscribers(mutation) {
    for (const sub of this.#subscribers)
      sub(mutation);
  }
  ensureHistory() {
    if (!this.#transaction)
      throw new Error("History tracking disabled.");
    return this.#transaction;
  }
  tracksHistory() {
    return !!this.#transaction;
  }
  get history() {
    this.ensureHistory();
    this[RecordDependency](HistorySentinel);
    if (!this.#rootTransaction)
      throw new Error("History tracking enabled, but no root transaction. Probably mutraction internal error.");
    return this.#rootTransaction.operations;
  }
  get generation() {
    return this.#generation;
  }
  advanceGeneration() {
    ++this.#generation;
  }
  // add another transaction to the stack
  startTransaction(name) {
    const transaction = this.ensureHistory();
    this.#transaction = { type: "transaction", parent: transaction, operations: [] };
    if (name)
      this.#transaction.transactionName = name;
    return this.#transaction;
  }
  // resolve and close the most recent transaction
  // throws if no transactions are active
  commit(transaction) {
    const actualTransaction = this.ensureHistory();
    if (transaction && transaction !== actualTransaction)
      throw new Error("Attempted to commit wrong transaction. Transactions must be resolved in stack order.");
    if (!actualTransaction.parent)
      throw new Error("Cannot commit root transaction");
    const parent = actualTransaction.parent;
    parent.operations.push(actualTransaction);
    actualTransaction.parent = void 0;
    this.#transaction = parent;
  }
  // undo all operations done since the beginning of the most recent trasaction
  // remove it from the transaction stack
  // if no transactions are active, undo all mutations
  rollback(transaction) {
    const actualTransaction = this.ensureHistory();
    if (transaction && transaction !== actualTransaction)
      throw new Error("Attempted to commit wrong transaction. Transactions must be resolved in stack order.");
    while (actualTransaction.operations.length)
      this.undo();
    this.#transaction = actualTransaction.parent ?? actualTransaction;
    this.advanceGeneration();
  }
  // undo last mutation or transaction and push into the redo stack
  undo() {
    const transaction = this.ensureHistory();
    const mutation = transaction.operations.pop();
    if (!mutation)
      return;
    this.advanceGeneration();
    this.undoOperation(mutation);
    this.#redos.unshift(mutation);
  }
  undoOperation(mutation) {
    if ("target" in mutation) {
      mutation.target[LastChangeGeneration] = this.generation;
    }
    switch (mutation.type) {
      case "change":
      case "delete":
        mutation.target[mutation.name] = mutation.oldValue;
        break;
      case "create":
        delete mutation.target[mutation.name];
        break;
      case "transaction":
        for (let i = mutation.operations.length; i-- > 0; ) {
          this.undoOperation(mutation.operations[i]);
        }
        return;
      case "arrayextend":
        mutation.target.length = mutation.oldLength;
        break;
      case "arrayshorten":
        mutation.target.push(...mutation.removed);
        break;
      default:
        mutation;
    }
    this.#notifySubscribers(mutation);
  }
  // repeat last undone mutation
  redo() {
    const transaction = this.ensureHistory();
    const mutation = this.#redos.shift();
    if (!mutation)
      return;
    this.advanceGeneration();
    this.redoOperation(mutation);
    transaction.operations.push(mutation);
  }
  redoOperation(mutation) {
    if ("target" in mutation) {
      mutation.target[LastChangeGeneration] = this.generation;
    }
    switch (mutation.type) {
      case "change":
      case "create":
        mutation.target[mutation.name] = mutation.newValue;
        break;
      case "delete":
        delete mutation.target[mutation.name];
        break;
      case "transaction":
        for (let i = 0; i < mutation.operations.length; i++) {
          this.redoOperation(mutation.operations[i]);
        }
        return;
      case "arrayextend":
        mutation.target[mutation.newIndex] = mutation.newValue;
        break;
      case "arrayshorten":
        mutation.target.length = mutation.newLength;
        break;
      default:
        mutation;
    }
    this.#notifySubscribers(mutation);
  }
  // clear the redo stack  
  // any direct mutation implicitly does this
  clearRedos() {
    this.#redos.length = 0;
  }
  clearHistory() {
    const transaction = this.ensureHistory();
    transaction.parent = void 0;
    transaction.operations.length = 0;
    this.clearRedos();
  }
  // record a mutation, if you have the secret key
  [RecordMutation](mutation) {
    if (this.#transaction) {
      this.#transaction.operations.push(Object.freeze(mutation));
    }
    this.clearRedos();
    this.advanceGeneration();
    this.setLastChangeGeneration(mutation.target);
    this.#notifySubscribers(mutation);
  }
  getLastChangeGeneration(target) {
    if (target === HistorySentinel)
      return this.generation;
    return target[LastChangeGeneration] ?? 0;
  }
  setLastChangeGeneration(target) {
    if (!Object.hasOwn(target, LastChangeGeneration)) {
      Object.defineProperty(target, LastChangeGeneration, {
        enumerable: false,
        writable: true,
        configurable: false
      });
    }
    target[LastChangeGeneration] = this.generation;
  }
  #dependencyTrackers = /* @__PURE__ */ new Set();
  startDependencyTrack() {
    let deps = new Dependency(this);
    this.#dependencyTrackers.add(deps);
    return deps;
  }
  endDependencyTrack(dep) {
    const wasTracking = this.#dependencyTrackers.delete(dep);
    ;
    if (!wasTracking)
      throw Error("Dependency tracker was not active on this tracker");
    return dep;
  }
  [RecordDependency](target) {
    for (const dt of this.#dependencyTrackers) {
      dt.addDependency(target);
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
  https:
    return Object.prototype.toString.call(item) === "[object Arguments]";
}
function makeProxyHandler(model, tracker) {
  let detached = false;
  function getOrdinary(target, name, receiver) {
    if (detached)
      return Reflect.get(target, name);
    if (name === IsTracked)
      return true;
    if (name === LastChangeGeneration)
      return target[LastChangeGeneration];
    tracker[RecordDependency](target);
    let result = Reflect.get(target, name, receiver);
    if (typeof result === "object" && !isTracked(result)) {
      const handler = makeProxyHandler(result, tracker);
      result = target[name] = new Proxy(result, handler);
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
    if (detached)
      return Reflect.get(target, name);
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
    if (detached)
      return Reflect.set(target, name, newValue);
    if (typeof newValue === "object" && !newValue[IsTracked]) {
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
    if (detached)
      return Reflect.set(target, name, newValue);
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
    if (detached)
      return Reflect.deleteProperty(target, name);
    const mutation = { type: "delete", target, name, oldValue: model[name] };
    tracker[RecordMutation](mutation);
    return Reflect.deleteProperty(target, name);
  }
  let set = setOrdinary, get = getOrdinary;
  if (Array.isArray(model)) {
    set = setArray;
    if (tracker.tracksHistory())
      get = getArrayTransactionShim;
  }
  if (isArguments(model))
    throw Error("Tracking of exotic arguments objects not supported");
  return { get, set, deleteProperty };
}
function isTracked(obj) {
  return typeof obj === "object" && !!obj[IsTracked];
}
function track(model, options) {
  if (isTracked(model))
    throw Error("Object already tracked");
  const tracker = new Tracker(options);
  const proxied = new Proxy(model, makeProxyHandler(model, tracker));
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
export {
  Tracker,
  describeMutation,
  isTracked,
  track,
  trackAsReadonlyDeep
};
