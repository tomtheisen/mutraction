// out/runtime.js
import { effect } from "mutraction";

// out/ElementSpan.js
var ElementSpan = class {
  startMarker = document.createTextNode("");
  endMarker = document.createTextNode("");
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
var tracker = void 0;
function setTracker(newTracker) {
  if (tracker)
    throw Error("Nested dom tracking is not supported. Apply the tracker attribute at the top level of your application.");
  tracker = newTracker;
}
function clearTracker() {
  if (!tracker)
    throw Error("No tracker to clear");
  tracker = void 0;
}
function effectOrDo(sideEffect) {
  if (tracker)
    effect(tracker, sideEffect, { suppressUntrackedWarning: true });
  else
    sideEffect();
}
function ForEach(array, map) {
  const capturedTracker = tracker;
  const result = new ElementSpan();
  const containers = [];
  effectOrDo(() => {
    const originalTracker = tracker;
    tracker = capturedTracker;
    for (let i = containers.length; i < array.length; i++) {
      const container = new ElementSpan();
      containers.push(container);
      effectOrDo(() => {
        const originalTracker2 = tracker;
        tracker = capturedTracker;
        const newNode = map(array[i]);
        container.replaceWith(newNode);
        tracker = originalTracker2;
      });
      result.append(container.removeAsFragment());
    }
    while (containers.length > array.length) {
      containers.pop().removeAsFragment();
    }
    tracker = originalTracker;
  });
  return result.removeAsFragment();
}
function ForEachPersist(array, map) {
  const capturedTracker = tracker;
  const result = new ElementSpan();
  const containers = [];
  const outputMap = /* @__PURE__ */ new WeakMap();
  effectOrDo(() => {
    const originalTracker = tracker;
    tracker = capturedTracker;
    for (let i = containers.length; i < array.length; i++) {
      const container = new ElementSpan();
      containers.push(container);
      effectOrDo(() => {
        const originalTracker2 = tracker;
        tracker = capturedTracker;
        const item = array[i];
        if (typeof item !== "object" || item == null)
          throw Error("Elements must be object in ForEachPersist");
        let newNode = outputMap.get(item);
        if (newNode == null) {
          outputMap.set(item, newNode = map(item));
        }
        container.replaceWith(newNode);
        tracker = originalTracker2;
      });
      result.append(container.removeAsFragment());
    }
    while (containers.length > array.length) {
      containers.pop().removeAsFragment();
    }
    tracker = originalTracker;
  });
  return result.removeAsFragment();
}
function element(name, staticAttrs, dynamicAttrs, ...children) {
  const el = document.createElement(name);
  for (let [name2, value] of Object.entries(staticAttrs ?? {})) {
    switch (name2) {
      case "mu:if":
        if (!value)
          return document.createTextNode("");
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
    if (!tracker)
      throw Error("Cannot apply dynamic properties without scoped tracker");
    switch (name2) {
      case "mu:if":
        effectOrDo(() => {
          if (getter())
            blank?.replaceWith(el);
          else
            el.replaceWith(blank ??= document.createTextNode(""));
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
  if (tracker) {
    let node = document.createTextNode("");
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
export {
  ForEach,
  ForEachPersist,
  child,
  clearTracker,
  element,
  setTracker
};
