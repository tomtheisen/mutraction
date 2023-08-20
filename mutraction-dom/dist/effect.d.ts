import { DependencyList } from "./dependency.js";
import { Tracker } from "./tracker.js";
import { Subscription } from "./types.js";
type EffectOptions = {
    suppressUntrackedWarning?: boolean;
    tracker?: Tracker;
};
export declare function effect(sideEffect: (dep: DependencyList) => (void | (() => void)), options?: EffectOptions): Subscription;
export {};
