// out/runtime.js
import { effect } from "mutraction";
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
function ForEach(array, map) {
  const result = document.createDocumentFragment();
  for (const e of array) {
    result.append(map(e));
  }
  return result;
}
var suppress = { suppressUntrackedWarning: true };
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
          }, suppress);
        } else {
          if (!attrGetter())
            blank = document.createTextNode("");
        }
        break;
      case "style":
        if (tracker) {
          effect(tracker, () => Object.assign(el.style, attrGetter()), suppress);
        } else {
          Object.assign(el.style, attrGetter());
        }
        break;
      case "classList":
        if (tracker) {
          effect(tracker, () => {
            const classMap = attrGetter();
            for (const e of Object.entries(classMap))
              el.classList.toggle(...e);
          }, suppress);
        } else {
          const classMap = attrGetter();
          for (const e of Object.entries(classMap))
            el.classList.toggle(...e);
        }
        break;
      default:
        if (tracker) {
          effect(tracker, () => el[name2] = attrGetter(), suppress);
        } else {
          el[name2] = attrGetter();
        }
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
    }, suppress);
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
