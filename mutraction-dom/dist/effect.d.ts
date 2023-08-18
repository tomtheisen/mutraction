import { DependencyList } from "./dependency.js";
import { Tracker } from "./tracker.js";
import { Subscription } from "./types.js";
type EffectOptions = {
    suppressUntrackedWarning?: boolean;
};
export declare function effect(tracker: Tracker, sideEffect: (dep: DependencyList) => (void | (() => void)), options?: EffectOptions): Subscription;
export {};
