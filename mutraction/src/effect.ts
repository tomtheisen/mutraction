import { DependencyList } from "./dependency.js";
import { Tracker } from "./tracker.js";

const emptyEffect = { dispose: () => {} };

type EffectOptions = {
    suppressUntrackedWarning?: boolean;
}
export function effect(tracker: Tracker, sideEffect: (dep: DependencyList) => (void | (() => void)), options: EffectOptions = {}) {
    let dep = tracker.startDependencyTrack();
    let lastResult = sideEffect(dep);
    dep.endDependencyTrack();

    if (dep.trackedProperties.size === 0) {
        if(!options.suppressUntrackedWarning) {
            console.warn("effect() callback has no dependencies on any tracked properties.  It will not fire again.");
        }
        return emptyEffect;
    }

    let latestGen = dep.getLatestChangeGeneration();
    function modelChangedForEffect() {
        lastResult?.();
        const depgen = dep.getLatestChangeGeneration();
        if (depgen === latestGen) return;
        latestGen = depgen;
        
        dep = tracker.startDependencyTrack();
        lastResult = sideEffect(dep);
        dep.endDependencyTrack();
    }
    
    return tracker.subscribe(modelChangedForEffect);
}
