import { Subscription } from "./types.js";

const nodeCleanups = new WeakMap<ChildNode, Subscription[]>;

export function registerCleanup(node: ChildNode, subscription: Subscription) {
    const cleanups = nodeCleanups.get(node);
    if (cleanups) {
        cleanups.push(subscription);
    }
    else {
        nodeCleanups.set(node, [subscription]);
    }
}

export function cleanup(node: ChildNode) {
    const cleanups = nodeCleanups.get(node);
    cleanups?.forEach(s => s.dispose());

    if (node instanceof Element) {
        node.childNodes.forEach(child => cleanup(child));
    }
}
