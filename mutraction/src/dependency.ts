import { PropReference } from "./propref.js";
import { Tracker } from "./tracker.js";

export class DependencyList {
    trackedProperties = new Set<PropReference>;
    #tracker: Tracker;
    #tracksAllChanges = false;
    active = true;

    constructor(tracker: Tracker) {
        this.#tracker = tracker;
    }

    addDependency(propRef: PropReference) {
        if (this.active) this.trackedProperties.add(propRef);
    }

    endDependencyTrack() {
        this.#tracker.endDependencyTrack(this);
    }

    /** Indicates that this dependency list is dependent on *all* tracked changes */
    trackAllChanges() {
        this.#tracksAllChanges = true;
    }

    getLatestChangeGeneration(): number {
        if (this.#tracksAllChanges) return this.#tracker.generation;
        let result = 0;
        for (let propRef of this.trackedProperties) {
            result = Math.max(result, propRef.generation);
        }
        return  result;
    }
}
