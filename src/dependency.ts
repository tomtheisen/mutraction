import { Tracker } from "./tracker";
import {  } from "./proxy";

export class Dependency {
    trackedObjects = new Set<object>;
    #tracker: Tracker;

    constructor(tracker: Tracker) {
        this.#tracker = tracker;
    }

    addDependency(target: object) {
        this.trackedObjects.add(target);
    }

    getLatestChangeGeneration(): number {
        let result = 0;
        for (let obj of this.trackedObjects) {
            result = Math.max(result, this.#tracker.getLastChangeGeneration(obj));
        }
        return  result;
    }
}
