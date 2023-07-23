/// <reference types="react" />
import type { Tracker } from "../../mutraction/dist/index.js";
type StoreHook = <Snapshot>(subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => Snapshot) => Snapshot;
export declare function trackComponent<TProps extends {}>(useSyncExternalStore: StoreHook, tracker: Tracker, Component: React.FC<TProps>): (props: TProps) => import("react").ReactNode;
export {};
//# sourceMappingURL=trackComponent.d.ts.map