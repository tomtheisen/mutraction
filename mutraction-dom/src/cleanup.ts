import { Subscription } from "./types.js";

const nodeCleanups = new WeakMap<ChildNode, Subscription[]>;

export function registerCleanup(node: ChildNode, subscription: Subscription) {
    if (subscription.noop) return;
    
    const cleanups = nodeCleanups.get(node);
    if (cleanups) {
        cleanups.push(subscription);
    }
    else {
        nodeCleanups.set(node, [subscription]);
    }
}

export const cleanup = (scheduleCleanup<ChildNode>).bind(null, doCleanup);

function doCleanup(node: ChildNode) {
    const cleanups = nodeCleanups.get(node);
    cleanups?.forEach(s => s.dispose());

    if (node instanceof Element) node.childNodes.forEach(doCleanup);
}

type CleanupItem<T = any> = {
    task: (data: T) => void;
    data: T;
}

let pending = false;
let queue: CleanupItem[] = [];

// dumb polyfill, come on safari
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

function processQueue(deadline: IdleDeadline) {
    let complete = 0;
    let start = performance.now();

    while(queue.length) {
        const { task, data} = queue.shift()!;
        task(data);

        const elapsed = performance.now() - start;
        const average = elapsed / ++complete;
        if (average * 2 > deadline.timeRemaining()) break;
    }

    if (queue.length) window.requestIdleCallback(processQueue);
    else pending = false;
}

export function scheduleCleanup<T>(task: (t: T) => void, data: T) {
    queue.push({ task, data });

    if (!pending) {
        window.requestIdleCallback(processQueue);
        pending = true;
    }
}