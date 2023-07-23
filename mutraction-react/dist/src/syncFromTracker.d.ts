/// <reference types="react" />
import { Tracker } from 'mutraction';
export declare function syncFromTracker<P extends {}>(tracker: Tracker, Component: React.FC<P>): import("react").FC<P>;
type ComponentWrapper = <P extends {}>(Component: React.FC<P>) => React.FC<P>;
export declare function trackAndSync<TModel extends {}>(model: TModel): [TModel, ComponentWrapper, Tracker];
export {};
//# sourceMappingURL=syncFromTracker.d.ts.map