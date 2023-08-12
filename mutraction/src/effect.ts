import { Tracker } from "./tracker.js";

const emptyEffect = { dispose: () => {} };

type EffectOptions = {
    suppressUntrackedWarning?: boolean;
}
export function effect(tracker: Tracker, sideEffect: () => void, options: EffectOptions = {}) {
    let dep = tracker.startDependencyTrack();
    sideEffect();
    dep.endDependencyTrack();

    if (dep.trackedProperties.size === 0) {
        if(!options.suppressUntrackedWarning) {
            console.warn("effect() callback has no dependencies on any tracked properties.  It will not fire again.");
        }
        return emptyEffect;
    }

    let latestGen = dep.getLatestChangeGeneration();
    function modelChangedForEffect() {
        const depgen = dep.getLatestChangeGeneration();
        if (depgen === latestGen) return;
        latestGen = depgen;
        
        dep = tracker.startDependencyTrack();
        sideEffect();
        dep.endDependencyTrack();
    }
    
    return tracker.subscribe(modelChangedForEffect);
}
