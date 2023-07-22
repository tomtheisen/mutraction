export { track, untrack, isTracked, getTracker } from './src/proxy';

// react store concept

/*
function useMutraction(model: object) {
    // we won't have a subscription right away, but we'll be ready
    let subscribedListener: undefined | (() => void) = undefined;

    function notify() {
        subscribedListener?.();
    }

    const [trackedModel, tracker] = track(model);

    function subscribe(listener: () => {}) {
        subscribedListener = listener;
        return () => untrack(model);
    }
    function getSnapshot() {
        return tracker.generation;
    }

    useSyncExternalStore(subscribe, getSnapshot);

    return [trackedModel, tracker];
}
*/