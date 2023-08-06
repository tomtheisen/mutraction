// out/src/syncFromTracker.js
import { track } from "mutraction";
import { isValidElement, useSyncExternalStore } from "react";

// out/src/TrackerContext.js
import { createContext, useContext } from "react";
var TrackerContext = createContext(void 0);
function useTrackerContext() {
  const tracker = useContext(TrackerContext);
  if (!tracker)
    throw Error("useTrackerContext requires <TrackerContext.Provider>");
  return tracker;
}
var TrackerContextProvider = TrackerContext.Provider;

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
function syncAllComponents(node) {
  if (typeof node !== "object" || node == null)
    return node;
  if (isValidElement(node)) {
    if (typeof node.type === "string")
      return node;
    const nodeTypeIsFunction = typeof node.type === "function";
    if (nodeTypeIsFunction && node.type.prototype && "render" in node.type.prototype)
      console.warn("This looks like a class component. Mutraction sync probably won't work: " + node.type.name);
    const newNode = { ...node };
    if (nodeTypeIsFunction) {
      const originalComponentFunction = node.type;
      newNode.type = syncFromContext(originalComponentFunction);
    }
    if ("children" in node.props) {
      newNode.props = { ...node.props };
      newNode.props.children = syncAllComponents(node.props.children);
      Object.freeze(newNode.props);
    }
    return Object.freeze(newNode);
  } else if (Symbol.iterator in node) {
    const array = [];
    for (const e of node)
      array.push(syncAllComponents(e));
    return array;
  } else {
    return node;
  }
}
function syncFromContext(Component) {
  return function TrackedComponent(props, context) {
    const tracker = useTrackerContext();
    const deps = tracker.startDependencyTrack();
    const rendered = Component(props, context);
    deps.endDependencyTrack();
    if (deps.trackedObjects.size > 0) {
      let subscribe2 = function(callback) {
        const subscription = tracker.subscribe(callback);
        return () => subscription.dispose();
      };
      var subscribe = subscribe2;
      useSyncExternalStore(subscribe2, () => deps.getLatestChangeGeneration());
    }
    const result = syncAllComponents(rendered);
    return result;
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
var ChangeHistory = () => {
  const tracker = useTrackerContext();
  function subscribe(callback) {
    const subscription = tracker.subscribe(callback);
    return () => subscription.dispose();
  }
  useSyncExternalStore2(subscribe, () => tracker.generation);
  return React.createElement("ol", null, tracker.history.map((m) => React.createElement("li", { key: key(m) }, describeMutation(m))));
};

// out/src/BoundInput.js
import React2, { useCallback } from "react";
function BoundInput({ bindValue, ...props }) {
  const tracker = useTrackerContext();
  const ref = tracker.getPropRef(bindValue);
  const change = useCallback((ev) => ref.current = ev.currentTarget.value, [ref]);
  return React2.createElement("input", { ...props, value: ref.current, onInput: change });
}

// out/src/mutrack.js
import React3 from "react";
function Mutrack({ tracker, component }) {
  const Synced = syncFromContext(component);
  return React3.createElement(
    TrackerContext.Provider,
    { value: tracker },
    React3.createElement(Synced, null)
  );
}
export {
  BoundInput,
  ChangeHistory,
  Mutrack,
  TrackerContext,
  TrackerContextProvider,
  key,
  syncFromContext,
  syncFromTracker,
  trackAndSync,
  useTrackerContext
};
