// out/src/syncFromTracker.js
import { track } from "mutraction";
import { useSyncExternalStore } from "react";

// out/src/TrackerContext.js
import { createContext, useContext } from "react";
var TrackerContext = createContext(void 0);
function useTrackerContext() {
  const tracker = useContext(TrackerContext);
  if (!tracker)
    throw Error("syncFromContext requires <TrackerContext.Provider>");
  return tracker;
}

// out/src/syncFromTracker.js
function syncFromTracker(tracker, Component) {
  return function TrackedComponent(props, context) {
    const deps = tracker.startDependencyTrack();
    const component = Component(props, context);
    deps.endDependencyTrack();
    if (deps.trackedObjects.size === 0) {
      console.warn(`No dependencies detected in ${Component.displayName ?? Component.name}. Ensure the component reads a tracked property to enable model synchronization.`);
    }
    function subscribe(callback) {
      const subscription = tracker.subscribe(callback);
      return () => subscription.dispose();
    }
    useSyncExternalStore(subscribe, () => deps.getLatestChangeGeneration());
    return component;
  };
}
function trackAndSync(model, options) {
  const [trackedModel, tracker] = track(model, options);
  function sync(Component) {
    return syncFromTracker(tracker, Component);
  }
  return [trackedModel, sync, tracker];
}

// out/src/key.js
var lastKey = 0;
var keyRegistry = /* @__PURE__ */ new WeakMap();
function key(obj) {
  if (obj == null)
    return -1;
  let key2 = keyRegistry.get(obj);
  if (key2)
    return key2;
  keyRegistry.set(obj, ++lastKey);
  return lastKey;
}

// out/src/ChangeHistory.js
import { describeMutation } from "mutraction";
import React, { useSyncExternalStore as useSyncExternalStore2 } from "react";
var ChangeHistory = ({ tracker }) => {
  function subscribe(callback) {
    const subscription = tracker.subscribe(callback);
    return () => subscription.dispose();
  }
  useSyncExternalStore2(subscribe, () => tracker.generation);
  return React.createElement("ol", null, tracker.history.map((m) => React.createElement("li", { key: key(m) }, describeMutation(m))));
};
export {
  ChangeHistory,
  TrackerContext,
  key,
  syncFromTracker,
  trackAndSync,
  useTrackerContext
};
