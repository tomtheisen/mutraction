import { PropReference } from "./propref.js";
import { Tracker } from "./tracker.js";
import { Key } from "./types.js";
export declare class DependencyList {
    #private;
    trackedProperties: Set<PropReference<any>>;
    constructor(tracker: Tracker);
    addDependency(target: object, name: Key): void;
    endDependencyTrack(): void;
    getLatestChangeGeneration(): number;
}
