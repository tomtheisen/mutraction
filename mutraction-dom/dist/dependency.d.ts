import { PropReference } from "./propref.js";
import { Tracker } from "./tracker.js";
import { Subscription } from "./types.js";
export declare class DependencyList {
    #private;
    active: boolean;
    constructor(tracker: Tracker);
    get trackedProperties(): ReadonlyArray<PropReference>;
    addDependency(propRef: PropReference): void;
    subscribe(callback: () => void): Subscription;
    notifySubscribers(): void;
    endDependencyTrack(): void;
    /** Indicates that this dependency list is dependent on *all* tracked changes */
    trackAllChanges(): void;
    untrackAll(): void;
}
