import { createOrRetrievePropRef } from './propref.js';
import { isTracked } from './proxy.js';
import { defaultTracker } from './tracker.js';

export { element, child } from './runtime.js';
export { ForEach, ForEachPersist } from './foreach.js';
export { choose } from './choose.js';
export { isTracked } from './proxy.js';
export { PromiseLoader } from './promiseLoader.js';
export { Swapper } from './swapper.js';
export { Tracker, TrackerOptions, defaultTracker, track } from './tracker.js';
export { PropReference, createOrRetrievePropRef } from './propref.js';
export { effect } from './effect.js';
export { DependencyList } from './dependency.js'
export { Router } from './router.js';
export { makeLocalStyle } from './makeLocalStyle.js';

export const version = "__VER__" as string;

// for devtool
const devtoolKey: any = Symbol.for("mutraction-dom");
const devtoolExported = {
    version,
    isTracked,
    defaultTracker,
    createOrRetrievePropRef,
    session: { "": "This is a storage for persisting state between mutraction devtools messages." },
};
Object.assign(window, { [devtoolKey]: Object.freeze(devtoolExported) });
