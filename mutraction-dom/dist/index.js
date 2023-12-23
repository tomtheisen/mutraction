// out/symbols.js
var RecordMutation = Symbol("RecordMutation");
var RecordSplice = Symbol("RecordSplice");
var TrackerOf = Symbol("TrackerOf");
var ProxyOf = Symbol("ProxyOf");
var RecordDependency = Symbol("RecordDependency");
var GetOriginal = Symbol("GetOriginal");
var AccessPath = Symbol("AccessPath");
var ItemsSymbol = Symbol("items");

// out/dependency.js
var DependencyList = class {
  #trackedProperties = /* @__PURE__ */ new Map();
  #tracker;
  #subscribers = /* @__PURE__ */ new Set();
  active = true;
  constructor(tracker) {
    this.#tracker = tracker;
  }
  get trackedProperties() {
    return Array.from(this.#trackedProperties.keys());
  }
  addDependency(propRef) {
    if (this.active) {
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
  notifySubscribers(trigger, info) {
    const subscriberSnapshot = Array.from(this.#subscribers);
    for (const callback of subscriberSnapshot)
      callback(trigger, info);
  }
  endDependencyTrack() {
    this.#tracker.endDependencyTrack(this);
  }
  untrackAll() {
    for (const sub of this.#trackedProperties.values())
      sub.dispose();
    this.#trackedProperties.clear();
  }
};

// out/debug.js
var debugModeKey = "mu:debugMode";
var debugUpdateDebounce = 250;
var isDebugMode = "sessionStorage" in globalThis && !!sessionStorage.getItem(debugModeKey);
var updateCallbacks = [];
var handle = 0;
function pendUpdate() {
  if (handle === 0) {
    handle = setTimeout(function updateDiagnostics() {
      for (const cb of updateCallbacks)
        cb();
      handle = 0;
    }, debugUpdateDebounce);
  }
}
if ("sessionStorage" in globalThis) {
  let enableDebugMode = function() {
    console.warn("debug mode is incomplete.");
    sessionStorage.setItem(debugModeKey, "true");
    location.reload();
  }, disableDebugMode = function() {
    sessionStorage.removeItem(debugModeKey);
    location.reload();
  };
  enableDebugMode2 = enableDebugMode, disableDebugMode2 = disableDebugMode;
  Object.assign(window, { [Symbol.for("mutraction.debug")]: enableDebugMode });
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
          } catch {
          }
        });
      return li;
    }, startInspectPick = function() {
      inspectButton.disabled = true;
      inspectButton.textContent = "\u2026";
      inspectedName.textContent = "(choose)";
      let inspectedElement;
      let originalBackground = "";
      function moveHandler(ev) {
        if (ev.target instanceof HTMLElement) {
          let target = ev.target;
          while (target && (getNodeAndTextDependencies(target)?.length ?? 0) === 0) {
            target = target.parentElement;
          }
          if (target != inspectedElement) {
            if (inspectedElement)
              inspectedElement.style.background = originalBackground;
            originalBackground = target?.style.background ?? "";
            console.log({ originalBackground });
            if (target)
              target.style.background = "#f0f4";
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
          inspectedElement.style.background = originalBackground;
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
    valueString2 = valueString, el2 = el, getNodeAndTextDependencies2 = getNodeAndTextDependencies, getPropRefListItem2 = getPropRefListItem, startInspectPick2 = startInspectPick, clampIntoView2 = clampIntoView;
    queueMicrotask(() => defaultTracker.subscribe(pendUpdate));
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
    let activeEffectsGeneration = -1;
    const propRefCountNumber = el("span", {}, "0");
    const propRefRefreshButton = el("button", {}, "\u21BB");
    const propRefList = el("ol", {});
    const propRefSummary = el("details", {}, el("summary", { cursor: "pointer" }, el("strong", {}, "Live PropRefs: "), propRefCountNumber, " ", propRefRefreshButton), propRefList);
    let seenGeneration = -1;
    const inspectButton = el("button", {}, "\u{1F50D}");
    inspectButton.addEventListener("click", startInspectPick);
    const inspectedName = el("span", {}, "(none)");
    const inspectedPropList = el("ol", {});
    const content = el("div", { padding: "1em", overflow: "auto" }, inspectButton, " ", el("strong", {}, "Inspected node:"), " ", inspectedName, inspectedPropList, effectSummary, propRefSummary);
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
var startInspectPick2;
var clampIntoView2;
var enableDebugMode2;
var disableDebugMode2;

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
            if (isDebugMode)
              setAccessPath(value, getAccessPath(target), "\u2203");
            if (target.has(value))
              return;
            const result = target.add(value);
            tracker[RecordMutation](target, ItemsSymbol);
            return result;
          };
        case "delete":
          return function delete$(value) {
            value = maybeGetProxy(value, tracker) ?? value;
            if (!target.has(value))
              return;
            const result = target.delete(value);
            tracker[RecordMutation](target, ItemsSymbol);
            return result;
          };
        case "clear":
          return function clear() {
            if (target.size === 0)
              return;
            target.clear();
            tracker[RecordMutation](target, ItemsSymbol);
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
            if (typeof result === "object" && result && isTracked(result) && isDebugMode) {
              setAccessPath(result, getAccessPath(target), `get(${key})`);
            }
            return result;
          };
        case "set":
          return function set(key, val) {
            assertSafeMapKey(key);
            const proxy = maybeGetProxy(val, tracker);
            if (proxy && isDebugMode)
              setAccessPath(proxy, getAccessPath(target), `get(${key})`);
            target.set(key, val = proxy ?? val);
            tracker[RecordMutation](target, ItemsSymbol);
            return receiver;
          };
        case "delete":
          return function delete$(key) {
            if (!target.delete(key))
              return false;
            tracker[RecordMutation](target, ItemsSymbol);
            return true;
          };
        case "clear":
          return function clear() {
            target.clear();
            tracker[RecordMutation](target, ItemsSymbol);
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
  if (val == null || typeof val !== "object" || isTracked(val))
    return false;
  if (!Object.isExtensible(val) || unproxyableConstructors.has(val.constructor))
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
      const original = result;
      return function proxyWrapped() {
        tracker.startTransaction(original.name ?? "auto");
        try {
          return original.apply(receiver, arguments);
        } finally {
          tracker.commit();
        }
      };
    }
    return result;
  }
  function getArrayTransactionShim(target, name, receiver) {
    if (!Array.isArray(target)) {
      throw Error("This object used to be an array.  Expected an array.");
    }
    if (name === "shift") {
      return function proxyShift() {
        try {
          return target.shift();
        } finally {
          tracker[RecordSplice](target, 0, 1, []);
        }
      };
    } else if (name === "unshift") {
      return function proxyUnshift() {
        try {
          return target.unshift(...arguments);
        } finally {
          tracker[RecordSplice](target, 0, 0, [...arguments]);
        }
      };
    } else if (name === "splice") {
      return function proxySplice(start, deleteCount, ...items) {
        if (deleteCount === void 0)
          deleteCount = target.length - start;
        try {
          return target.splice(start, deleteCount, ...items);
        } finally {
          tracker[RecordSplice](target, start, deleteCount, items);
        }
      };
    } else if (typeof name === "string" && mutatingArrayMethods.includes(name)) {
      const arrayFunction = target[name];
      return function proxyWrapped() {
        tracker.startTransaction(String(name));
        try {
          return arrayFunction.apply(receiver, arguments);
        } finally {
          tracker.commit();
        }
      };
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
    const initialSets = setsCompleted;
    const wasSet = Reflect.set(target, name, newValue, receiver);
    if (wasSet && initialSets == setsCompleted++) {
      tracker[RecordMutation](target, name);
    }
    return wasSet;
  }
  function setArray(target, name, newValue, receiver) {
    if (!Array.isArray(target)) {
      throw Error("This object used to be an array.  Expected an array.");
    }
    if (isArrayIndex(name)) {
      const index = parseInt(name, 10);
      if (index >= target.length) {
        const wasSet = Reflect.set(target, name, newValue, receiver);
        tracker[RecordMutation](target, "length");
        ++setsCompleted;
        return wasSet;
      }
    }
    return setOrdinary(target, name, newValue, receiver);
  }
  function deleteProperty(target, name) {
    const wasDeleted = Reflect.deleteProperty(target, name);
    if (wasDeleted)
      tracker[RecordMutation](target, name);
    return wasDeleted;
  }
  let set = setOrdinary, get = getOrdinary;
  if (Array.isArray(model)) {
    set = setArray;
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
      dispose: () => this.#subscribers.delete(dependencyList)
    };
  }
  notifySubscribers(changeInfo) {
    if (this.#notifying)
      console.warn(`Re-entrant property subscription for '${String(this.prop)}'`);
    const subscriberSnapshot = Array.from(this.#subscribers);
    this.#notifying = true;
    for (const dep of subscriberSnapshot)
      dep.notifySubscribers(this, changeInfo);
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
  if (!result) {
    objectPropRefs.set(prop, result = new PropReference(object, prop));
    if (isDebugMode)
      pendUpdate();
  }
  return result;
}

// out/tracker.js
var defaultTrackerOptions = {
  autoTransactionalize: true
};
var Tracker = class {
  #transaction;
  #dependencyTrackers = [];
  #subscribers = /* @__PURE__ */ new Set();
  // mutation subscribers
  options = defaultTrackerOptions;
  constructor(options = {}) {
    this.setOptions(options);
  }
  setOptions(options = {}) {
    this.options = Object.freeze({ ...defaultTrackerOptions, ...options });
  }
  /**
   * Turn on change tracking for an object.
   * @param model
   * @returns a proxied model object
   */
  track(model) {
    if (isTracked(model))
      throw Error("Object already tracked");
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
  /** Add another transaction to the stack  */
  startTransaction(name) {
    if (this.#transaction) {
      ++this.#transaction.depth;
    } else {
      this.#transaction = { type: "transaction", depth: 1, ordinaryChanges: /* @__PURE__ */ new Set(), arrayChanges: /* @__PURE__ */ new Map() };
      if (name)
        this.#transaction.transactionName = name;
    }
    return this.#transaction;
  }
  /** resolve and close the most recent transaction
    * throws if no transactions are active
    */
  commit() {
    if (!this.#transaction)
      throw Error("Attempted to commit transaction when none were open.");
    if (this.#transaction.depth > 1) {
      --this.#transaction.depth;
    } else {
      const notified = /* @__PURE__ */ new Set();
      for (const propRef of this.#transaction.ordinaryChanges) {
        for (const dependencyList of propRef.subscribers) {
          if (!notified.has(dependencyList)) {
            dependencyList.notifySubscribers();
            notified.add(dependencyList);
          }
        }
      }
      if (this.#transaction.arrayChanges.size)
        throw "TODO";
      this.#transaction = void 0;
      this.#notifySubscribers();
    }
  }
  /**
   * Subscribe to be notified when a tracked object is mutated.
   * @param callback
   * @returns a subscription with a dispose() method that can canel the subscription
   */
  subscribe(callback) {
    this.#subscribers.add(callback);
    const dispose = () => this.#subscribers.delete(callback);
    return { dispose };
  }
  #notifySubscribers(prop) {
    for (const s of this.#subscribers)
      s(prop);
  }
  /**
   * Record an array splice, if you have the secret key.
   * A splice consists of a start index, a number of items to delete, and an array of new items to insert
   */
  [RecordSplice](target, start, deleteCount, insert) {
    if (this.#transaction) {
      let layers = this.#transaction.arrayChanges.get(target);
      if (!layers)
        this.#transaction.arrayChanges.set(target, layers = [{ elements: /* @__PURE__ */ new Map() }]);
      let lastLayer = layers.at(-1);
      if (deleteCount != insert.length) {
        lastLayer.finalSplice = { newLength: target.length, suffixLength: target.length - start - insert.length };
      }
      layers.push(lastLayer = { elements: /* @__PURE__ */ new Map() });
      insert.forEach((item, i) => lastLayer.elements.set(start + i, item));
    } else {
      const lengthPropRef = createOrRetrievePropRef(target, "length");
      const suffixLength = target.length - insert.length - start;
      lengthPropRef.notifySubscribers({ suffixLength });
      this.#notifySubscribers(lengthPropRef);
      for (let i = 0; i < insert.length; i++) {
        const key = (start + i).toString();
        const itemPropRef = createOrRetrievePropRef(target, key);
        itemPropRef.notifySubscribers();
        this.#notifySubscribers(itemPropRef);
      }
    }
  }
  /** record a mutation, if you have the secret key  */
  [RecordMutation](target, name) {
    const propRef = createOrRetrievePropRef(target, name);
    if (!this.#transaction) {
      propRef.notifySubscribers();
      this.#notifySubscribers(propRef);
    } else if (Array.isArray(target) && isArrayIndex(name)) {
      let layers = this.#transaction.arrayChanges.get(target);
      if (!layers)
        this.#transaction.arrayChanges.set(target, layers = [{ elements: /* @__PURE__ */ new Map() }]);
      let lastLayer = layers.at(-1);
      const idx = parseInt(name);
      lastLayer.elements.set(idx, target[idx]);
    } else {
      this.#transaction.ordinaryChanges.add(propRef);
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

// out/effect.js
var emptyEffect = { dispose: () => {
} };
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
  let subscription = dep.subscribe(effectDependencyChanged);
  let disposed = false;
  function effectDispose() {
    if (disposed)
      console.error("Effect already disposed");
    disposed = true;
    dep.untrackAll();
    subscription.dispose();
  }
  function effectDependencyChanged(trigger, changeInfo) {
    if (typeof lastResult === "function")
      lastResult();
    effectDispose();
    disposed = false;
    dep = tracker.startDependencyTrack();
    lastResult = sideEffect(dep, trigger, changeInfo);
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
var cleanup = scheduleCleanup.bind(null, doCleanup);
function doCleanup(node) {
  const cleanups = nodeCleanups.get(node);
  cleanups?.forEach((s) => s.dispose());
  if (node instanceof Element)
    node.childNodes.forEach(cleanup);
}
var pending = false;
var queue = [];
if (!("requestIdleCallback" in globalThis)) {
  let requestIdleCallback = function(callback) {
    requestAnimationFrame(() => processQueue(never));
  };
  requestIdleCallback2 = requestIdleCallback;
  const never = {
    didTimeout: false,
    timeRemaining() {
      return 1e3;
    }
  };
  Object.assign(globalThis, { requestIdleCallback });
}
var requestIdleCallback2;
function processQueue(deadline) {
  let complete = 0;
  let start = performance.now();
  while (queue.length) {
    const { task, data } = queue.shift();
    task(data);
    const elapsed = performance.now() - start;
    const average = elapsed / ++complete;
    if (average * 2 > deadline.timeRemaining())
      break;
  }
  if (queue.length)
    window.requestIdleCallback(processQueue);
  else
    pending = false;
}
function scheduleCleanup(task, data) {
  queue.push({ task, data });
  if (!pending) {
    window.requestIdleCallback(processQueue);
    pending = true;
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
    const parent = this.startMarker.parentNode;
    if (parent instanceof DocumentFragment && parent.firstChild === this.startMarker && parent.lastChild === this.endMarker) {
      return parent;
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
    while (this.startMarker.nextSibling !== this.endMarker) {
      const next = this.startMarker.nextSibling;
      if (!next)
        throw Error("End marker not found as subsequent document sibling as start marker");
      cleanup(next);
      next.remove();
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
function newForEachOutput() {
  return { container: new ElementSpan() };
}
function ForEach(array, map) {
  if (typeof array === "function")
    return Swapper(() => ForEach(array(), map));
  const result = new ElementSpan();
  const outputs = [];
  const arrayDefined = array ?? [];
  const lengthSubscription = effect(function forEachLengthEffect(lengthDep, propRef, info) {
    if (info?.suffixLength) {
      if (arrayDefined.length < outputs.length) {
        const toRemove = outputs.length - arrayDefined.length;
        const removed = outputs.splice(arrayDefined.length - info.suffixLength, toRemove);
        for (const item of removed) {
          scheduleCleanup(forEachCleanupOutput, item);
        }
      } else if (arrayDefined.length > outputs.length) {
        const toInsert = arrayDefined.length - outputs.length;
        const newOutputs = Array(toInsert).fill(null).map(newForEachOutput);
        let insertIndex = outputs.length - info.suffixLength;
        outputs.splice(insertIndex, 0, ...newOutputs);
        const frag = document.createDocumentFragment();
        for (const output of newOutputs)
          frag.append(output.container.removeAsFragment());
        const resultParent = result.startMarker.parentNode;
        if (insertIndex === 0) {
          resultParent.insertBefore(frag, result.startMarker.nextSibling);
        } else {
          const precedingContainer = outputs[insertIndex - 1].container;
          resultParent.insertBefore(frag, precedingContainer.endMarker.nextSibling);
        }
      }
    }
    const arrayLen = arrayDefined.length;
    for (let i = outputs.length; i < arrayLen; i++) {
      const output = newForEachOutput();
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
    if (outputs.length > 0 && arrayLen === 0) {
      result.emptyAsFragment();
      for (const output of outputs)
        scheduleCleanup(forEachCleanupOutput, output);
      outputs.length = 0;
    } else
      while (outputs.length > arrayLen) {
        const output = outputs.pop();
        output.container.removeAsFragment();
        scheduleCleanup(forEachCleanupOutput, output);
      }
  }, suppress2);
  result.registerCleanup({ dispose() {
    outputs.forEach(forEachCleanupOutput);
  } });
  result.registerCleanup(lengthSubscription);
  return result.removeAsFragment();
}
function forEachCleanupOutput({ cleanup: cleanup2, container, subscription }) {
  cleanup2?.();
  subscription?.dispose();
  container.cleanup();
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
var version = "0.25.0";
export {
  ForEach,
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
