import { PropReference } from "./propref.js";
import { Tracker } from "./tracker.js";
import { Subscription } from "./types.js";

/**  */
export type PropRefChangeInfo = {
    suffixLength?: number; // size of "sticky" suffix in array length change
}
type Subscriber = (trigger?: PropReference, info?: PropRefChangeInfo) => void;

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
    #subscribers: Set<Subscriber> = new Set;
    active = true;

    constructor(tracker: Tracker) {
        this.#tracker = tracker;
    }

    get trackedProperties(): ReadonlyArray<PropReference> {
        return Array.from(this.#trackedProperties.keys());
    }

    addDependency(propRef: PropReference) {
        if (this.active) {
            if (this.#trackedProperties.has(propRef)) return;
            const propSubscription = propRef.subscribe(this);
            this.#trackedProperties.set(propRef, propSubscription);
        }
    }

    subscribe(callback: Subscriber): Subscription {
        this.#subscribers.add(callback);
        return { dispose: () => this.#subscribers.delete(callback) };
    }

    notifySubscribers(trigger?: PropReference, info?: PropRefChangeInfo) {
        // we only want to notify subscribers that existed at the 
        // beginning of the notification cycle
        const subscriberSnapshot = Array.from(this.#subscribers);
        for (const callback of subscriberSnapshot) callback(trigger, info);
    }

    endDependencyTrack() {
        this.#tracker.endDependencyTrack(this);
    }

    untrackAll() {
        for (const sub of this.#trackedProperties.values()) sub.dispose();
        this.#trackedProperties.clear();
    }
}
