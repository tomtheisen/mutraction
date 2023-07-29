import { track, Tracker, TrackerOptions } from 'mutraction';
import { useSyncExternalStore } from 'react';  

export function syncFromTracker<P extends {}>(tracker: Tracker, Component: React.FC<P>) {
    const TrackedComponent: React.FC<P> = function TrackedComponent(props: P, context?: any){
        const deps = tracker.startDependencyTrack();
        const component = Component(props, context);
        deps.endDependencyTrack();
        if (deps.trackedObjects.size === 0) {
            console.warn(
                `No dependencies detected in ${Component.displayName ?? Component.name}. `
                + `Ensure the component reads a tracked property to enable model synchronization.`);
        }

        function subscribe(callback: () => void) {
            const subscription = tracker.subscribe(callback);
            return () => subscription.dispose();
        }
        useSyncExternalStore(subscribe, () => deps.getLatestChangeGeneration());

        return component;
    }
    return TrackedComponent;
}

type ComponentWrapper = <P extends {}>(Component: React.FC<P>) => React.FC<P>;

export function trackAndSync<TModel extends {}>(model: TModel, options?: TrackerOptions)
    : [TModel, ComponentWrapper, Tracker] 
{
    const [trackedModel, tracker] = track(model, options);
    function sync<P extends {}>(Component: React.FC<P>) {
        return syncFromTracker(tracker, Component);
    }
    return [trackedModel, sync, tracker];
}
