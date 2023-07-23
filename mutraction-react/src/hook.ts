import type { Tracker } from "../../mutraction/dist/index";
import { useSyncExternalStore } from 'react';

export function trackComponent<TProps extends {}>(tracker: Tracker, Component: React.FC<TProps>) {
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
