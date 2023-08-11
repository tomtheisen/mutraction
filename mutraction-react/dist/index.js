// out/src/sync.js
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

// out/src/sync.js
function syncAllComponents(node) {
  if (typeof node !== "object" || node == null)
    return node;
  if (isValidElement(node)) {
    let newNode = void 0;
    if (typeof node.type === "function") {
      newNode ??= { ...node };
      const originalComponentFunction = node.type;
      newNode.type = sync(originalComponentFunction);
    }
    if ("children" in node.props) {
      newNode ??= { ...node };
      newNode.props = { ...node.props };
      newNode.props.children = syncAllComponents(node.props.children);
      Object.freeze(newNode.props);
    }
    return newNode ? Object.freeze(newNode) : node;
  } else if (Symbol.iterator in node) {
    const array = [];
    for (const e of node)
      array.push(syncAllComponents(e));
    return array;
  } else {
    return node;
  }
}
var syncedComponentRegistry = /* @__PURE__ */ new WeakMap();
function sync(Component) {
  const synced = syncedComponentRegistry.get(Component);
  if (synced)
    return synced;
  const name = Component.name ? "Tracked:" + Component.name : "TrackedComponent";
  const namer = {
    [name]: function(props, context) {
      const tracker = useTrackerContext();
      const deps = tracker.startDependencyTrack();
      const rendered = Component(props, context);
      deps.endDependencyTrack();
      if (deps.trackedProperties.size > 0) {
        let subscribe2 = function(callback) {
          const subscription = tracker.subscribe(callback);
          return () => subscription.dispose();
        };
        var subscribe = subscribe2;
        useSyncExternalStore(subscribe2, () => deps.getLatestChangeGeneration());
      }
      const result = syncAllComponents(rendered);
      return result;
    }
  };
  syncedComponentRegistry.set(Component, namer[name]);
  return namer[name];
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
import React2 from "react";
function BoundInput({ bindValue, ...props }) {
  const tracker = useTrackerContext();
  const ref = tracker.getPropRef(bindValue);
  const change = (ev) => ref.current = ev.currentTarget.value;
  return React2.createElement("input", { ...props, value: ref.current, onInput: change });
}
function BoundCheckbox({ bindChecked, ...props }) {
  const tracker = useTrackerContext();
  const ref = tracker.getPropRef(bindChecked);
  const change = (ev) => ref.current = ev.currentTarget.checked;
  return React2.createElement("input", { type: "checkbox", ...props, checked: ref.current, onChange: change });
}
function BoundTextarea({ bindValue, ...props }) {
  const tracker = useTrackerContext();
  const ref = tracker.getPropRef(bindValue);
  const change = (ev) => ref.current = ev.currentTarget.value;
  return React2.createElement("textarea", { ...props, value: ref.current, onInput: change });
}

// out/src/SyncTree.js
import React3 from "react";
function SyncTree({ tracker, component }) {
  const Synced = sync(component);
  return React3.createElement(
    TrackerContext.Provider,
    { value: tracker },
    React3.createElement(Synced, null)
  );
}
export {
  BoundCheckbox,
  BoundInput,
  BoundTextarea,
  ChangeHistory,
  SyncTree,
  TrackerContext,
  key,
  sync,
  useTrackerContext
};
