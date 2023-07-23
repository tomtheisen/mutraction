"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // out/src/symbols.js
  var require_symbols = __commonJS({
    "out/src/symbols.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.LastChangeGeneration = exports.RecordDependency = exports.Detach = exports.GetTracker = exports.IsTracked = exports.RecordMutation = void 0;
      exports.RecordMutation = Symbol("RecordMutation");
      exports.IsTracked = Symbol("IsTracked");
      exports.GetTracker = Symbol("GetTracker");
      exports.Detach = Symbol("Detach");
      exports.RecordDependency = Symbol("RecordDependency");
      exports.LastChangeGeneration = Symbol("LastChangeGeneration");
    }
  });

  // out/src/dependency.js
  var require_dependency = __commonJS({
    "out/src/dependency.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Dependency = void 0;
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
      exports.Dependency = Dependency;
    }
  });

  // out/src/tracker.js
  var require_tracker = __commonJS({
    "out/src/tracker.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Tracker = void 0;
      var symbols_1 = require_symbols();
      var dependency_1 = require_dependency();
      var Tracker = class {
        #subscribers = /* @__PURE__ */ new Set();
        constructor(callback) {
          if (callback)
            this.subscribe(callback);
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
        #transaction = { type: "transaction", operations: [] };
        #redos = [];
        #generation = 0;
        get history() {
          return this.#transaction.operations;
        }
        get generation() {
          return this.#generation;
        }
        advanceGeneration() {
          ++this.#generation;
        }
        // add another transaction to the stack
        startTransaction() {
          this.#transaction = { type: "transaction", parent: this.#transaction, operations: [] };
        }
        // resolve and close the most recent transaction
        // throws if no transactions are active
        commit() {
          if (!this.#transaction?.parent)
            throw "Cannot commit root transaction";
          const parent = this.#transaction.parent;
          parent.operations.push(this.#transaction);
          this.#transaction.parent = void 0;
          this.#transaction = parent;
        }
        // undo all operations done since the beginning of the most recent trasaction
        // remove it from the transaction stack
        // if no transactions are active, undo all mutations
        rollback() {
          while (this.#transaction.operations.length)
            this.undo();
          this.#transaction = this.#transaction.parent ?? this.#transaction;
          this.advanceGeneration();
        }
        // undo last mutation or transaction and push into the redo stack
        undo() {
          const mutation = this.#transaction.operations.pop();
          if (!mutation)
            return;
          this.advanceGeneration();
          this.undoOperation(mutation);
          this.#redos.unshift(mutation);
        }
        undoOperation(mutation) {
          if ("target" in mutation) {
            mutation.target[symbols_1.LastChangeGeneration] = this.generation;
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
              break;
            case "arrayextend":
              mutation.target.length = mutation.oldLength;
              break;
            case "arrayshorten":
              mutation.target.push(...mutation.removed);
              break;
            default:
              mutation;
          }
        }
        // repeat last undone mutation
        redo() {
          const mutation = this.#redos.shift();
          if (!mutation)
            return;
          this.advanceGeneration();
          this.redoOperation(mutation);
          this.#transaction.operations.push(mutation);
        }
        redoOperation(mutation) {
          if ("target" in mutation) {
            mutation.target[symbols_1.LastChangeGeneration] = this.generation;
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
              break;
            case "arrayextend":
              mutation.target[mutation.newIndex] = mutation.newValue;
              break;
            case "arrayshorten":
              mutation.target.length = mutation.newLength;
              break;
            default:
              mutation;
          }
        }
        // clear the redo stack  
        // any direct mutation implicitly does this
        clearRedos() {
          this.#redos.length = 0;
        }
        // record a mutation, if you have the secret key
        [symbols_1.RecordMutation](mutation) {
          this.#transaction.operations.push(Object.freeze(mutation));
          this.clearRedos();
          this.advanceGeneration();
          this.setLastChangeGeneration(mutation.target);
          this.#notifySubscribers(mutation);
        }
        getLastChangeGeneration(target) {
          return target[symbols_1.LastChangeGeneration] ?? 0;
        }
        setLastChangeGeneration(target) {
          if (!Object.hasOwn(target, symbols_1.LastChangeGeneration)) {
            Object.defineProperty(target, symbols_1.LastChangeGeneration, {
              enumerable: false,
              writable: true,
              configurable: false
            });
          }
          target[symbols_1.LastChangeGeneration] = this.generation;
        }
        #dependencyTrackers = /* @__PURE__ */ new Set();
        startDependencyTrack() {
          let deps = new dependency_1.Dependency(this);
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
        [symbols_1.RecordDependency](target) {
          for (let dt of this.#dependencyTrackers)
            dt.addDependency(target);
        }
      };
      exports.Tracker = Tracker;
    }
  });

  // out/src/proxy.js
  var require_proxy = __commonJS({
    "out/src/proxy.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.track = exports.untrack = exports.getTracker = exports.isTracked = void 0;
      var tracker_1 = require_tracker();
      var symbols_1 = require_symbols();
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
        function get(target, name) {
          if (detached)
            return Reflect.get(target, name);
          if (name === symbols_1.IsTracked)
            return true;
          if (name === symbols_1.GetTracker)
            return tracker;
          if (name === symbols_1.LastChangeGeneration)
            return target[symbols_1.LastChangeGeneration];
          if (name === symbols_1.Detach)
            return () => {
              detached = true;
              return target;
            };
          tracker[symbols_1.RecordDependency](target);
          let result = target[name];
          if (typeof result === "object" && !isTracked(result)) {
            const handler = makeProxyHandler(result, tracker);
            result = target[name] = new Proxy(result, handler);
          }
          return result;
        }
        function setOrdinary(target, name, newValue) {
          if (detached)
            return Reflect.set(target, name, newValue);
          if (typeof newValue === "object" && !newValue[symbols_1.IsTracked]) {
            const handler = makeProxyHandler(newValue, tracker);
            newValue = new Proxy(newValue, handler);
          }
          const mutation = name in target ? { type: "change", target, name, oldValue: model[name], newValue } : { type: "create", target, name, newValue };
          tracker[symbols_1.RecordMutation](mutation);
          return Reflect.set(target, name, newValue);
        }
        function setArray(target, name, newValue) {
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
              tracker[symbols_1.RecordMutation](shorten);
              return Reflect.set(target, name, newValue);
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
              tracker[symbols_1.RecordMutation](extension);
              return Reflect.set(target, name, newValue);
            }
          }
          return setOrdinary(target, name, newValue);
        }
        function deleteProperty(target, name) {
          if (detached)
            return Reflect.deleteProperty(target, name);
          const mutation = { type: "delete", target, name, oldValue: model[name] };
          tracker[symbols_1.RecordMutation](mutation);
          return Reflect.deleteProperty(target, name);
        }
        let set = setOrdinary;
        if (Array.isArray(model))
          set = setArray;
        if (isArguments(model))
          throw Error("Tracking of exotic arguments objects not supported");
        return { get, set, deleteProperty };
      }
      function isTracked(obj) {
        return typeof obj === "object" && obj[symbols_1.IsTracked];
      }
      exports.isTracked = isTracked;
      function getTracker(obj) {
        return obj[symbols_1.GetTracker];
      }
      exports.getTracker = getTracker;
      function untrack(obj) {
        if (!isTracked(obj))
          return obj;
        return obj[symbols_1.Detach]();
      }
      exports.untrack = untrack;
      function track(model, callback) {
        if (isTracked(model))
          throw Error("Object already tracked");
        const tracker = new tracker_1.Tracker(callback);
        const proxied = new Proxy(model, makeProxyHandler(model, tracker));
        return [proxied, tracker];
      }
      exports.track = track;
    }
  });

  // out/index.js
  var require_out = __commonJS({
    "out/index.js"(exports) {
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Tracker = exports.getTracker = exports.isTracked = exports.untrack = exports.track = void 0;
      var proxy_1 = require_proxy();
      Object.defineProperty(exports, "track", { enumerable: true, get: function() {
        return proxy_1.track;
      } });
      Object.defineProperty(exports, "untrack", { enumerable: true, get: function() {
        return proxy_1.untrack;
      } });
      Object.defineProperty(exports, "isTracked", { enumerable: true, get: function() {
        return proxy_1.isTracked;
      } });
      Object.defineProperty(exports, "getTracker", { enumerable: true, get: function() {
        return proxy_1.getTracker;
      } });
      var tracker_1 = require_tracker();
      Object.defineProperty(exports, "Tracker", { enumerable: true, get: function() {
        return tracker_1.Tracker;
      } });
    }
  });
  require_out();
})();
