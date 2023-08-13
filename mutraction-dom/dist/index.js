// out/runtime.js
import { effect } from "mutraction";
var tracker = void 0;
var suppress = { suppressUntrackedWarning: true };
function element(name, attrGetters, ...children) {
  const el = document.createElement(name);
  let blank = void 0;
  let isTopTracker = false;
  if (attrGetters.tracker) {
    if (tracker)
      console.error("Nested tracker attributes are not supported. Apply the tracker attribute at the top level of your application.");
    else {
      isTopTracker = true;
      tracker = attrGetters.tracker();
    }
  }
  for (let [name2, attrGetter] of Object.entries(attrGetters ?? {})) {
    switch (name2) {
      case "if":
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
  if (isTopTracker)
    tracker = void 0;
  return blank ?? el;
}
function child(getter) {
  const result = getter();
  if (result instanceof HTMLElement)
    return result;
  if (result instanceof Text)
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
  child,
  element
};
