/// <reference types="react" />
import { Tracker, TrackerOptions } from 'mutraction';
/** @deprecated */
export declare function syncFromTracker<P extends {}>(tracker: Tracker, Component: React.FC<P>): React.FC<P>;
export declare function syncFromContext<P extends {}>(Component: React.FC<P>): (props: P, context?: any) => import("react").ReactNode;
type ComponentWrapper = <P extends {}>(Component: React.FC<P>) => React.FC<P>;
export declare function trackAndSync<TModel extends {}>(model: TModel, options?: TrackerOptions): [TModel, ComponentWrapper, Tracker];
export {};
