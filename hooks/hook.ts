// npm install @types/react @types/react-dom react react-dom --no-save

import { track, Tracker } from "../index";
import { useSyncExternalStore } from 'react';

/*
function useMutraction(model: object) {
    // we won't have a subscription right away, but we'll be ready
    let subscribedListener: undefined | (() => void) = undefined;

    function notify() {
        subscribedListener?.();
    }

    const [trackedModel, tracker] = track(model, notify);

    function subscribe(listener: () => void) {
        subscribedListener = listener;
        return () => subscribedListener = undefined;
    }
    function getSnapshot() {
        return tracker.generation;
    }

    useSyncExternalStore(subscribe, getSnapshot);

    return [trackedModel, tracker];
}
*/

export function tracked<TProps extends {}>(tracker: Tracker, Component: React.FC<TProps>) {
    return function TrackedComponent(props: TProps){
        const deps = tracker.startDependencyTrack();
        
        const component = Component(props);

        tracker.endDependencyTrack(deps);

        function subscribe() {
            console.log("tracked subscribe", arguments)
            return function unsubscribe() {
                console.log("tracked unsubscribe")
                // no closures, no resources, no disposal, no unsubscribe
            };
        }
        useSyncExternalStore(subscribe, () => deps.getLatestChangeGeneration());

        return component;
    }
}
