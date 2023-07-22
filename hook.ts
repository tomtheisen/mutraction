import { track, untrack } from "./index";
import { useSyncExternalStore } from 'react';


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
