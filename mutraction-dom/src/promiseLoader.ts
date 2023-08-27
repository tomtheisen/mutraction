import { ElementSpan } from "./elementSpan.js"

export function PromiseLoader(promise: Promise<Node>, spinner: Node = document.createTextNode("")) {
    const span = new ElementSpan(spinner);
    promise.then(result => span.replaceWith(result));
    return span.removeAsFragment();
}
