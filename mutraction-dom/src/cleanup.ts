import { Subscription } from "./types.js";

type CleanupItem<T = any> = {
    task: (data: T) => void;
    data: T;
}

const nodeCleanups = new WeakMap<ChildNode, Subscription[]>;

export function registerCleanupForNode(node: ChildNode, subscription: Subscription) {
    if (subscription.noop) return;
    
    const cleanups = nodeCleanups.get(node);
    if (cleanups) {
        cleanups.push(subscription);
    }
    else {
        nodeCleanups.set(node, [subscription]);
    }
}

/** 
 * Immediately dispose all the subscriptions held by a DOM node and its descendants.
 * This is useful when it's being removed from the document.
 * You don't usually need to call this in application code.  
 * Mutraction does it for you, unless you're imperatively manipulating the document.
 */
export const cleanupNode = (scheduleCleanup<ChildNode>).bind(null, doCleanup);

function doCleanup(node: ChildNode) {
    const cleanups = nodeCleanups.get(node);
    if (cleanups) for (const s of cleanups) s.dispose();

    if (node instanceof Element) node.childNodes.forEach(doCleanup);
}

let pending = false;
let queue: CleanupItem[] = [];

function processQueue(deadline: IdleDeadline) {
    let complete = 0;
    let start = performance.now();

    while(queue.length) {
        const { task, data } = queue.shift()!;
        task(data);

        const elapsed = performance.now() - start;
        const average = elapsed / ++complete;
        if (average * 2 > deadline.timeRemaining()) break;
    }

    if (queue.length) window.requestIdleCallback(processQueue);
    else pending = false;
}

/**
 * Immediately and synchronously perform all cleanups scheduled via `scheduleCleanup()`
 */
export function doScheduledCleanupsNow() {
    for (const { task, data } of queue) task(data);
    queue.length = 0;
}

export function scheduleCleanup<T>(task: (t: T) => void, data: T) {
    queue.push({ task, data });

    if (!pending) {
        window.requestIdleCallback(processQueue);
        pending = true;
    }
}

// dumb requestIdleCallback polyfill, come on safari
if (!("requestIdleCallback" in globalThis)) {
    const never: IdleDeadline = {
        didTimeout: false,
        timeRemaining() { return 1e3; },
    }

    Object.assign(globalThis, {
        requestIdleCallback(callback: IdleRequestCallback) {
            requestAnimationFrame(callback.bind(null, never));
        }
    });
}
