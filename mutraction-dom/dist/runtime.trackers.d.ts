import { DependencyList } from "./dependency.js";
import { Tracker } from "./tracker.js";
export declare const trackers: Tracker[];
export declare function setTracker(newTracker: Tracker): void;
export declare function clearTracker(): void;
export declare function effectOrDo(sideEffect: (dep?: DependencyList) => (void | (() => void))): void;
