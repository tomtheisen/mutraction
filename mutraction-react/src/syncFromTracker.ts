import { track, Tracker, TrackerOptions } from 'mutraction';
import { isValidElement, useSyncExternalStore } from 'react';
import { useTrackerContext } from './TrackerContext.js';

/** @deprecated */
export function syncFromTracker<P extends {}>(tracker: Tracker, Component: React.FC<P>): React.FC<P> {
    return function TrackedComponent(props: P, context?: any){
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
}

/** Transforms a node to add tracking to top and all descendent component nodes */
function syncAllComponents(node: React.ReactNode): React.ReactNode {
    if (typeof node !== "object" || node == null) return node;

    if (isValidElement(node)) {
        if (typeof node.type === "string") return node; // it's a host component

        const nodeTypeIsFunction = typeof node.type === "function";

        if (nodeTypeIsFunction && "render" in node.type.prototype)
            console.warn("This looks like a class component. Mutraction sync probably won't work: "+ node.type.name);

        const newNode = { ...node };

        // Don't apply sync to special react things like fragments, providers, suspense, etc.
        // Their children still need to be synced though.
        if (nodeTypeIsFunction) {
            // sync for changes
            const originalComponentFunction = node.type as React.FC;
            newNode.type = syncFromContext(originalComponentFunction);
        }

        if ("children" in node.props) {
            newNode.props = { ...node.props };
            newNode.props.children = syncAllComponents(node.props.children);
            Object.freeze(newNode.props);
        }

        return Object.freeze(newNode);
    }
    else if (Symbol.iterator in node) {
        const array = [];
        // node is probably an array, but react allows any iterable
        for (const e of node) array.push(syncAllComponents(e));
        return array;
    }
    else {
        return node;
    }
}

export function syncFromContext<P extends {}>(Component: React.FC<P>) {
    return function TrackedComponent(props: P, context?: any){
        const tracker = useTrackerContext();

        const deps = tracker.startDependencyTrack();
        const rendered: React.ReactNode = Component(props, context);
        deps.endDependencyTrack();

        function subscribe(callback: () => void) {
            const subscription = tracker.subscribe(callback);
            return () => subscription.dispose();
        }
        useSyncExternalStore(subscribe, () => deps.getLatestChangeGeneration());

        const result = syncAllComponents(rendered);
        return result;
    }
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
