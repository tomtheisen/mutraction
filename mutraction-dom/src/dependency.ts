import { PropReference, createOrRetrievePropRef } from "./propref.js";
import { Tracker } from "./tracker.js";
import { Subscription } from "./types.js";

type Subscriber = (trigger?: PropReference) => void;

/**
 * Accumulates a list of properties that are read from.  
 * Normally you wouldn't use this directly from application.
 * Mostly, it's an implementation detail of effect(), but there might be a few uses here and there.
 * @see PropReference
 * @see effect
 */
export class DependencyList {
    #trackedProperties = new Map<PropReference, Subscription>;
    #tracker: Tracker;
    #tracksAllChanges = false;
    #subscribers: Set<Subscriber> = new Set;
    /** get operations of tracked prop refs will be added when this is the top dependency list */
    active = true;

    /** If an untracked object starts being tracked while this DependencyList is on top of the stack, console warn.
     * Useful for Swapper(), maybe other stuff too.
     */
    newTrackingWarning?: string;

    constructor(tracker: Tracker) {
        this.#tracker = tracker;
    }

    get trackedProperties(): ReadonlyArray<PropReference> {
        return Array.from(this.#trackedProperties.keys());
    }

    addDependency(propRef: PropReference) {
        if (this.active && !this.#tracksAllChanges) {
            if (this.#trackedProperties.has(propRef)) return;
            const propSubscription = propRef.subscribe(this);
            this.#trackedProperties.set(propRef, propSubscription);
        }
    }

    subscribe(callback: Subscriber): Subscription {
        this.#subscribers.add(callback);
        return { dispose: () => this.#subscribers.delete(callback) };
    }

    notifySubscribers(trigger?: PropReference) {
        // we only want to notify subscribers that existed at the 
        // beginning of the notification cycle
        const subscriberSnapshot = Array.from(this.#subscribers);
        for (const callback of subscriberSnapshot) callback(trigger);
    }

    endDependencyTrack() {
        this.#tracker.endDependencyTrack(this);
    }

    /** Indicates that this dependency list is dependent on *all* tracked changes */
    trackAllChanges() {
        if (this.#tracksAllChanges) return; // already doing it
        
        this.untrackAll();
        const historyPropRef = createOrRetrievePropRef(this.#tracker, "history");
        this.addDependency(historyPropRef);
        this.#tracksAllChanges = true;
    }

    untrackAll() {
        for (const sub of this.#trackedProperties.values()) sub.dispose();
        this.#trackedProperties.clear();
    }
}
