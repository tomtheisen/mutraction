/// <reference types="react" />
/**
 * Higher-order react component.  It retrieves a mutraction Tracker from react context.
 * Then it uses it to listen for property reads within the whole component tree.
 * If any of the component dependencies are updated, it's re-rendered via useSyncExternalStore.
 * Any child components in the element output of this component will be identically wrapped.
 * This way, an entire component tree will be synchronized.
 * @param Component is the function component to track
 * @returns a wrapped tracking component
 */
export declare function sync<P extends {}>(Component: React.FC<P>): React.FC<P>;
