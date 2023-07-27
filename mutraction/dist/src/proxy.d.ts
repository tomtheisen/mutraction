import { Tracker, TrackerOptions } from "./tracker.js";
export declare function isTracked(obj: object): boolean;
export declare function getTracker(obj: object): any;
export declare function untrack(obj: object): object;
export declare function track<TModel extends object>(model: TModel, options?: TrackerOptions): [TModel, Tracker];
//# sourceMappingURL=proxy.d.ts.map