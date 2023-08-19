import { Tracker } from "./tracker.js";
export declare function makeProxyHandler<TModel extends object>(model: TModel, tracker: Tracker): ProxyHandler<TModel>;
export declare function isTracked(obj: object): boolean;
