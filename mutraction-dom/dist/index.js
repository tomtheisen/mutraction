// out/runtime.js
import { effect } from "mutraction";
var tracker = null;
var suppress = { suppressUntrackedWarning: true };
function element(name, attrGetters, ...children) {
  const el = document.createElement(name);
  let blank = void 0;
  for (let [name2, attrGetter] of Object.entries(attrGetters ?? {})) {
    if (name2 === "if") {
      effect(tracker, () => {
        if (attrGetter())
          blank?.replaceWith(el);
        else
          el.replaceWith(blank ??= document.createTextNode(""));
      }, suppress);
    } else if (name2 === "style") {
      effect(tracker, () => Object.assign(el.style, attrGetter()), suppress);
    } else if (name2 === "classList") {
      effect(tracker, () => {
        const classMap = attrGetter();
        for (const e of Object.entries(classMap))
          el.classList.toggle(...e);
      }, suppress);
    } else {
      effect(tracker, () => el[name2] = attrGetter(), suppress);
    }
  }
  el.append(...children);
  return blank ?? el;
}
function child(getter) {
  const result = getter();
  if (result instanceof HTMLElement)
    return result;
  if (result instanceof Text)
    return result;
  let node = document.createTextNode("");
  effect(tracker, () => {
    const newNode = document.createTextNode(String(getter() ?? ""));
    node.replaceWith(newNode);
    node = newNode;
  }, suppress);
  return node;
}
export {
  child,
  element
};
