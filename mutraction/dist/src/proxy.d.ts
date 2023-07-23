import { Tracker } from "./tracker";
import type { SingleMutation } from "./types";
export declare function isTracked(obj: object): any;
export declare function getTracker(obj: object): any;
export declare function untrack(obj: object): object;
export declare function track<TModel extends object>(model: TModel, callback?: (mutation: SingleMutation) => void): [TModel, Tracker];
//# sourceMappingURL=proxy.d.ts.map