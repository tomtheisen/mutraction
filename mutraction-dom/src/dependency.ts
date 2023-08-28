import { PropReference, createOrRetrievePropRef } from "./propref.js";
import { Tracker } from "./tracker.js";
import { Subscription } from "./types.js";

export class DependencyList {
    #trackedProperties = new Map<PropReference, Subscription>;
    #tracker: Tracker;
    #tracksAllChanges = false;
    #subscribers: Set<() => void> = new Set;
    active = true;

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

    subscribe(callback: () => void): Subscription {
        this.#subscribers.add(callback);
        return { dispose: () => this.#subscribers.delete(callback) };
    }

    notifySubscribers() {
        // we only want to notify subscribers that existed at the 
        // beginning of the notification cycle
        const subscriberSnapshot = Array.from(this.#subscribers);
        for (const callback of subscriberSnapshot) callback();
    }

    endDependencyTrack() {
        this.#tracker.endDependencyTrack(this);
    }

    /** Indicates that this dependency list is dependent on *all* tracked changes */
    trackAllChanges() {
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
