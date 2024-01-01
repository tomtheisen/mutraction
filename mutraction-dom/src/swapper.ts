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
    const span = new ElementSpan;

    const swapperSubscription = effect(function swapperEffect(dep) {
        span.empty();
        dep.newTrackingWarning = "track() was called during Swapper() callback.  That's not generally recommended.  You might have some swap triggers you didn't intend."
        const output = nodeFactory();

        if (isNodeOptions(output)) {
            span.replaceWith(output.node);
            return output.cleanup;
        }
        else if (output != null) {
            span.replaceWith(output);
            return;
        }
    });
    span.registerCleanup(swapperSubscription);

    return span.removeAsFragment();
}
