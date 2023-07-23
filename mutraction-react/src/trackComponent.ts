import type { Tracker } from "../../mutraction/dist/index.js";

// TODO: this is another react instance somehow
//import { useSyncExternalStore } from 'react';  

type StoreHook = <Snapshot>(
    subscribe: (onStoreChange: () => void) => () => void,
    getSnapshot: () => Snapshot
) => Snapshot;

export function trackComponent<TProps extends {}>(useSyncExternalStore: StoreHook, tracker: Tracker, Component: React.FC<TProps>) {
    return function TrackedComponent(props: TProps){
        const deps = tracker.startDependencyTrack();
        const component = Component(props);
        deps.endDependencyTrack();

        function subscribe(callback: () => void) {
            const subscription = tracker.subscribe(callback);
            return function unsubscribe() {
                subscription.dispose();
            };
        }
        useSyncExternalStore(subscribe, () => deps.getLatestChangeGeneration());

        return component;
    }
}
