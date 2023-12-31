export { element, child } from './runtime.js';
export { ForEach, ForEachPersist } from './foreach.js';
export { choose } from './choose.js';
export { isTracked, neverTrack } from './proxy.js';
export { PromiseLoader } from './promiseLoader.js';
export { Swapper } from './swapper.js';
export { Tracker, TrackerOptions, defaultTracker, track } from './tracker.js';
export { PropReference, createOrRetrievePropRef } from './propref.js';
export { effect } from './effect.js';
export { Router } from './router.js';
export { makeLocalStyle } from './makeLocalStyle.js';
export { untrackedClone } from './untrackedClone.js';

// https://github.com/timocov/dts-bundle-generator/issues/283
// export * as cleanup from "./cleanup.js";

import { cleanupNode, doScheduledCleanupsNow, registerCleanupForNode, scheduleCleanup } from "./cleanup.js";
export const cleanup = {
    cleanupNode: cleanupNode,
    doScheduledCleanupsNow: doScheduledCleanupsNow,
    registerCleanupForNode: registerCleanupForNode,
    scheduleCleanup: scheduleCleanup,
};

export const version = "__VER__" as string;