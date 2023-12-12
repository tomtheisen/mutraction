
let pending = false;
let queue: (() => void)[] = [];

// polyfill
if (!("requestIdleCallback" in globalThis)) {
    const never: IdleDeadline = {
        didTimeout: false,
        timeRemaining() { return 1e3; },
    }

    function requestIdleCallback(callback: IdleRequestCallback) {
        requestAnimationFrame(() => processQueue(never));
    }
    Object.assign(window, { requestIdleCallback });
}

function processQueue(deadline: IdleDeadline) {
    let complete = 0;
    let start = performance.now();

    while(queue.length) {
        queue.shift()!();

        const elapsed = performance.now() - start;
        const average = elapsed / ++complete;
        if (average * 2 > deadline.timeRemaining()) break;
    }

    if (queue.length) requestIdleCallback(processQueue);
    else pending = false;
}

export function scheduleCleanup(clean: () => void) {
    queue.push(clean);

    if (!pending) {
        requestIdleCallback(processQueue);
        pending = true;
    }
}