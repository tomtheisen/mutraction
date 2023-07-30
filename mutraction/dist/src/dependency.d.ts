import { Tracker } from "./tracker.js";
export declare class Dependency {
    #private;
    trackedObjects: Set<object>;
    constructor(tracker: Tracker);
    addDependency(target: object): void;
    endDependencyTrack(): void;
    getLatestChangeGeneration(): number;
}
