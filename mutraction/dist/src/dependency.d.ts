import { PropReference } from "./propref.js";
import { Tracker } from "./tracker.js";
export declare class DependencyList {
    #private;
    trackedProperties: Set<PropReference<any>>;
    constructor(tracker: Tracker);
    addDependency(propRef: PropReference): void;
    endDependencyTrack(): void;
    /** Indicates that this dependency list is dependent on *all* tracked changes */
    trackAllChanges(): void;
    getLatestChangeGeneration(): number;
}
