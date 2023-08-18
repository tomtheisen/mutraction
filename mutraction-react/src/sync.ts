import { isValidElement, useSyncExternalStore } from 'react';
import { useTrackerContext } from './TrackerContext.js';

/** 
 * Transforms a node to add tracking to top and all descendent component nodes.
 * React elements are all frozen, so we need to clone them to change them.
 * If no changes are necessary, the original node is returned.
 */
function syncAllComponents(node: React.ReactNode): React.ReactNode {
    if (typeof node !== "object" || node == null) return node;

    if (isValidElement(node)) {
        // TODO: detect class components.  Either support them or warn.

        // the new node, if necessary
        let newNode: React.ReactNode | undefined = undefined;

        // Don't apply sync to special react things like fragments, providers, suspense, etc.
        // Their children still need to be synced though.
        if (typeof node.type === "function") {
            newNode ??= { ...node };
            // sync for changes
            const originalComponentFunction = node.type as React.FC;
            newNode.type = sync(originalComponentFunction);
        }

        if ("children" in node.props) {
            newNode ??= { ...node };
            newNode.props = { ...node.props };
            newNode.props.children = syncAllComponents(node.props.children);
            Object.freeze(newNode.props);
        }

        return newNode ? Object.freeze(newNode) : node;
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

// maps from un-tracked to tracked components
// Reference equality is necessary for reconciliation, so we keep only one of each
const syncedComponentRegistry: WeakMap<React.FC<any>, React.FC<any>> = new WeakMap;

/**
 * Higher-order react component.  It retrieves a mutraction Tracker from react context.
 * Then it uses it to listen for property reads within the whole component tree.
 * If any of the component dependencies are updated, it's re-rendered via useSyncExternalStore.
 * Any child components in the element output of this component will be identically wrapped.
 * This way, an entire component tree will be synchronized.
 * @param Component is the function component to track
 * @returns a wrapped tracking component
 */
export function sync<P extends {}>(Component: React.FC<P>): React.FC<P> {
    const synced = syncedComponentRegistry.get(Component);
    if (synced) return synced;

    const name = Component.name ? "Tracked:" + Component.name : "TrackedComponent";
    // this object gives the function a .name property
    const namer = {
        [name]: function(props: P, context?: any) {
            const tracker = useTrackerContext();
    
            const deps = tracker.startDependencyTrack();
            const rendered: React.ReactNode = Component(props, context);
            deps.endDependencyTrack();
    
            if (deps.trackedProperties.length > 0) {
                function subscribe(callback: () => void) {
                    const subscription = deps.subscribe(callback);
                    return () => subscription.dispose();
                }
    
                // Call the police! Conditional hook!
                // You could make this if unconditional.  
                // It would just be doing extra work.
                // It's theoretically possible that 
                //    * something else would cause this to re-render
                //    * a dependency would be found based on conditional logic of a non-tracked property
                // If that ever happens, something else would need to be done here.
                // But I bet it won't.
                useSyncExternalStore(subscribe, () => ({}));
            }
    
            const result = syncAllComponents(rendered);
            return result;
        }
    };

    syncedComponentRegistry.set(Component, namer[name]);

    return namer[name];
}
