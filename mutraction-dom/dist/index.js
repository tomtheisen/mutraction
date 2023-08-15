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
  const result = new ElementSpan();
  const containers = [];
  effectOrDo(() => {
    for (let i = containers.length; i < array.length; i++) {
      const container = new ElementSpan();
      containers.push(container);
      effectOrDo(() => {
        container.replaceWith(map(array[i]));
      });
      result.append(container.removeAsFragment());
    }
    while (containers.length > array.length) {
      containers.pop().removeAsFragment();
    }
  });
  return result.removeAsFragment();
}
function element(name, attrGetters, ...children) {
  const el = document.createElement(name);
  let blank = void 0;
  for (let [name2, attrGetter] of Object.entries(attrGetters ?? {})) {
    switch (name2) {
      case "mu:if":
        if (tracker) {
          effect(tracker, () => {
            if (attrGetter())
              blank?.replaceWith(el);
            else
              el.replaceWith(blank ??= document.createTextNode(""));
          }, { suppressUntrackedWarning: true });
        } else {
          if (!attrGetter())
            blank = document.createTextNode("");
        }
        break;
      case "style":
        effectOrDo(() => {
          Object.assign(el.style, attrGetter());
        });
        break;
      case "classList":
        effectOrDo(() => {
          const classMap = attrGetter();
          for (const e of Object.entries(classMap))
            el.classList.toggle(...e);
        });
        break;
      default:
        effectOrDo(() => {
          el[name2] = attrGetter();
        });
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
  child,
  clearTracker,
  element,
  setTracker
};
