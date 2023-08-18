import { DependencyList } from "./dependency.js";
import { effect } from "./effect.js";
import { Tracker } from "./tracker.js";

export const trackers: Tracker[] = [];

export function setTracker(newTracker: Tracker) {
    if (trackers.length)
        throw Error("Nested dom tracking is not supported. "
            + "Apply the tracker attribute at the top level of your application.");
    trackers.unshift(newTracker);
}

export function clearTracker() {
    if (trackers.length === 0)
        throw Error("No tracker to clear");
    if (trackers.length > 1)
        throw Error("Internal error: too many trackers");
    trackers.unshift();
}

export function effectOrDo(sideEffect: (dep?: DependencyList) => (void | (() => void))) {
    const originalTracker = trackers[0];
    if (originalTracker) {
        function scopedEffect(dep: DependencyList) {
            trackers.unshift(originalTracker);
            sideEffect(dep);
            trackers.shift();
        }
        effect(originalTracker, scopedEffect, { suppressUntrackedWarning: true });
    }
    else {
        sideEffect();
    }
}
