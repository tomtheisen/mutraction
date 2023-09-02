import { effect } from "./effect.js";
import { ElementSpan } from "./elementSpan.js";

/**
 * Automatically replaces an entire DOM node when its dependencies change.
 * Normally, only node contents and attributes are dynamically updated, but not DOM nodes themselves.
 * @param nodeFactory produces a DOM node, and has a dependency on one or more tracked properties.
 * @returns a DOM node that replaces itself when its dependencies change.
 */
export function Swapper(nodeFactory: () => Node) {
    const span = new ElementSpan();
    effect(() => span.replaceWith(nodeFactory()));
    return span.removeAsFragment();
}