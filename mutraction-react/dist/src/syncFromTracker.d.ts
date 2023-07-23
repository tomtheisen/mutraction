/// <reference types="react" />
import { Tracker } from 'mutraction';
export declare function syncFromTracker<TProps extends {}>(tracker: Tracker, Component: React.FC<TProps>): (props: TProps) => import("react").ReactNode;
export declare function trackAndSync<TProps extends {}, TModel extends {}>(model: TModel): (Tracker | TModel | ((Component: React.FC<TProps>) => (props: TProps) => import("react").ReactNode))[];
//# sourceMappingURL=syncFromTracker.d.ts.map