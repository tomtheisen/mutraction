import { track, Tracker } from 'mutraction';
import { useSyncExternalStore } from 'react';  

export function syncFromTracker<TProps extends {}>(tracker: Tracker, Component: React.FC<TProps>) {
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

export function trackAndSync<TProps extends {}, TModel extends {}>(model: TModel) {
    const [trackedModel, tracker] = track(model);
    function sync(Component: React.FC<TProps>) {
        return syncFromTracker(tracker, Component);
    }
    return [trackedModel, sync, tracker];
}
