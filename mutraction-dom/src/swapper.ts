import { effect } from "./effect.js";
import { ElementSpan } from "./elementSpan.js";
import { NodeOptions, isNodeOptions } from "./types.js";

/**
 * Automatically replaces an entire DOM node when its dependencies change.
 * Normally, only node contents and attributes are dynamically updated, but not DOM nodes themselves.
 * @param nodeFactory produces a DOM node, and has a dependency on one or more tracked properties.
 * @returns a DOM node that replaces itself when its dependencies change.
 */
export function Swapper(nodeFactory: () => Node | NodeOptions) {
    const span = new ElementSpan();
    let cleanup: (() => void) | undefined;

    effect(() => {
        cleanup?.();

        const output = nodeFactory();
        if (isNodeOptions(output)) {
            span.replaceWith(output.node);
            cleanup = output.cleanup;
        }
        else {
            span.replaceWith(output);
            cleanup = undefined;
        }
    });
    return span.removeAsFragment();
}
