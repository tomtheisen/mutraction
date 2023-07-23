import { Tracker } from "./tracker";
export declare class Dependency {
    #private;
    trackedObjects: Set<object>;
    constructor(tracker: Tracker);
    addDependency(target: object): void;
    endDependencyTrack(): void;
    getLatestChangeGeneration(): number;
}
//# sourceMappingURL=dependency.d.ts.map