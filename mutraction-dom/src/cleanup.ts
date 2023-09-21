import { Subscription } from "./types.js";

const nodeCleanups = new WeakMap<Node, Subscription[]>;

export function registerCleanup(node: Node, subscription: Subscription) {
    const cleanups = nodeCleanups.get(node);
    if (cleanups) {
        cleanups.push(subscription);
    }
    else {
        nodeCleanups.set(node, [subscription]);
    }
}

export function cleanup(node: Node) {
    const cleanups = nodeCleanups.get(node);
    cleanups?.forEach(s => s.dispose());

    if (node instanceof Element) {
        node.childNodes.forEach(child => cleanup(child));
    }
}
