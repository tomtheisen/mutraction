import { isDebugMode } from "./debug.js";
import { DependencyList } from "./dependency.js";
import { PropReference } from "./propref.js";
import { Tracker, defaultTracker } from "./tracker.js";
import { Subscription } from "./types.js";

const emptyEffect: Subscription = { dispose: () => {} };

type EffectOptions = {
    suppressUntrackedWarning?: boolean;
    tracker?: Tracker;
}

let activeEffectsGeneration = 0;
const activeEffects = new Map<string, number>();
function recordActiveEffect(sideEffect: SideEffect) {
    const name = sideEffect.name || "(anonymous)";
    const current = activeEffects.get(name);
    if (current) activeEffects.set(name, current + 1);
    else activeEffects.set(name, 1);
    ++activeEffectsGeneration;
}

function removeActiveEffect(sideEffect: SideEffect) {
    const name = sideEffect.name || "(anonymous)";
    const current = activeEffects.get(name);
    if (!current || current <= 1) activeEffects.delete(name);
    else activeEffects.set(name, current - 1);
    ++activeEffectsGeneration;
}

export function getActiveEffects() {
    return { activeEffects, generation: activeEffectsGeneration };
}

type SideEffect = (dep: DependencyList, trigger?: PropReference) => (void | (() => void));
/**
 * Runs a callback, and remembers the tracked properties accessed.
 * Any time one of them changes, it runs the callback again.
 * Each time it runs, the set of dependencies is re-calculated so branches and short-circuits are generally safe.
 * @param sideEffect is the callback to invoke.
 * @param options 
 * @returns a subscription that can be disposed to turn the effect off.
 */
export function effect(sideEffect: SideEffect, options: EffectOptions = {}): Subscription {
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

    if (isDebugMode) recordActiveEffect(sideEffect);
    let subscription = dep.subscribe(effectDependencyChanged);

    // tear down old subscriptions
    let disposed = false;
    let changing = false;
    function effectDispose() {
        if (disposed) console.error("Effect already disposed");
        disposed = true;

        dep.untrackAll();
        subscription.dispose();
        if (!changing && isDebugMode) removeActiveEffect(sideEffect);
    };

    function effectDependencyChanged(trigger?: PropReference) {
        if (typeof lastResult === "function") lastResult(); // user cleanup

        changing = true;
        effectDispose();
        changing = disposed = false;
        
        dep = tracker.startDependencyTrack();
        lastResult = sideEffect(dep, trigger);
        dep.endDependencyTrack();
        subscription = dep.subscribe(effectDependencyChanged);
    }

    return { dispose: effectDispose };
}
