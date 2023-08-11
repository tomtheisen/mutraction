import { Tracker } from "./tracker.js";
type EffectOptions = {
    suppressUntrackedWarning?: boolean;
};
export declare function effect(tracker: Tracker, sideEffect: () => void, options?: EffectOptions): {
    dispose: () => boolean;
};
export {};
