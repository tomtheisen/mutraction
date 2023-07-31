import { Tracker, TrackerOptions } from "./tracker.js";
import type { ReadonlyDeep } from "./types.js";
export declare function isTracked(obj: object): boolean;
export declare function getTracker(obj: object): any;
export declare function track<TModel extends object>(model: TModel, options?: TrackerOptions): [TModel, Tracker];
export declare function trackAsReadonlyDeep<TModel extends object>(model: TModel, options?: TrackerOptions): [ReadonlyDeep<TModel>, Tracker];
