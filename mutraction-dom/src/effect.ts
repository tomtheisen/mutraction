import { DependencyList } from "./dependency.js";
import { PropReference } from "./propref.js";
import { Tracker, defaultTracker } from "./tracker.js";
import { Subscription } from "./types.js";

const emptyEffect: Subscription = { dispose: () => {} };

type EffectOptions = {
    suppressUntrackedWarning?: boolean;
    tracker?: Tracker;
}

/**
 * Runs a callback, and remembers the tracked properties accessed.
 * Any time one of them changes, it runs the callback again.
 * Each time it runs, the set of dependencies is re-calculated so branches and short-circuits are generally safe.
 * @param sideEffect is the callback to invoke.
 * @param options 
 * @returns a subscription that can be disposed to turn the effect off.
 */
export function effect(sideEffect: (dep: DependencyList, trigger?: PropReference) => (void | (() => void)), options: EffectOptions = {}): Subscription {
    const { tracker = defaultTracker, suppressUntrackedWarning = false } = options;
    let dep = tracker.startDependencyTrack();

    let lastResult: ReturnType<typeof sideEffect>;
    try {
        lastResult = sideEffect(dep);
    }
    finally {
        dep.endDependencyTrack();
    }

    if (dep.trackedProperties.length === 0) {
        if(!suppressUntrackedWarning) {
            console.warn("effect() callback has no dependencies on any tracked properties.  It will not fire again.");
        }
        return emptyEffect;
    }

    let subscription = dep.subscribe(effectDependencyChanged);

    // tear down old subscriptions
    const effectDispose = () => {
        dep.untrackAll();
        subscription.dispose();
    };

    function effectDependencyChanged(trigger?: PropReference) {
        if (typeof lastResult === "function") lastResult(); // user cleanup

        effectDispose();
        
        dep = tracker.startDependencyTrack();
        lastResult = sideEffect(dep, trigger);
        dep.endDependencyTrack();
        subscription = dep.subscribe(effectDependencyChanged);
    }

    return { dispose: effectDispose };
}
