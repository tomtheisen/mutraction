import { Tracker } from "./tracker.js";
type EffectOptions = {
    suppressUntrackedWarning?: boolean;
};
export declare function effect(tracker: Tracker, sideEffect: () => (void | (() => void)), options?: EffectOptions): {
    dispose: () => void;
};
export {};
