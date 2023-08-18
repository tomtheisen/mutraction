import { DependencyList } from "./dependency.js";
import { Tracker } from "./tracker.js";
import { Subscription } from "./types.js";

const emptyEffect: Subscription = { dispose: () => {} };

type EffectOptions = {
    suppressUntrackedWarning?: boolean;
}
export function effect(tracker: Tracker, sideEffect: (dep: DependencyList) => (void | (() => void)), options: EffectOptions = {}): Subscription {
    let dep = tracker.startDependencyTrack();
    let lastResult = sideEffect(dep);
    dep.endDependencyTrack();

    if (dep.trackedProperties.length === 0) {
        if(!options.suppressUntrackedWarning) {
            console.warn("effect() callback has no dependencies on any tracked properties.  It will not fire again.");
        }
        return emptyEffect;
    }

    let subscription = dep.subscribe(effectDependencyChanged);

    // tear down old subscriptions
    const dispose = () => {
        dep.untrackAll();
        subscription.dispose();
    };

    function effectDependencyChanged() {
        lastResult?.(); // user cleanup

        dispose();
        
        dep = tracker.startDependencyTrack();
        lastResult = sideEffect(dep);
        dep.endDependencyTrack();
        subscription = dep.subscribe(effectDependencyChanged);
    }

    return { dispose };
}
