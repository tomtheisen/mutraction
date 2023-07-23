import { track, Tracker } from 'mutraction';
import { useSyncExternalStore, memo } from 'react';  

export function syncFromTracker<P extends {}>(tracker: Tracker, Component: React.FC<P>) {
    const TrackedComponent: React.FC<P> = function TrackedComponent(props: P, context?: any){
        const deps = tracker.startDependencyTrack();
        const component = Component(props, context);
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
    return TrackedComponent;
}

type ComponentWrapper = <P extends {}>(Component: React.FC<P>) => React.FC<P>;

export function trackAndSync<TModel extends {}>(model: TModel): [TModel, ComponentWrapper, Tracker] {
    const [trackedModel, tracker] = track(model);
    function sync<P extends {}>(Component: React.FC<P>) {
        return syncFromTracker(tracker, Component);
    }
    return [trackedModel, sync, tracker];
}
