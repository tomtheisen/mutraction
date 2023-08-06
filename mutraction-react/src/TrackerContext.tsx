import { Tracker } from 'mutraction';
import { createContext, useContext } from 'react';

export const TrackerContext = createContext<Tracker | undefined>(undefined);

export function useTrackerContext(): Tracker {
    const tracker = useContext(TrackerContext);
    if (!tracker) throw Error("syncFromContext requires <TrackerContext.Provider>");
    return tracker;
}

export const TrackerContextProvider = TrackerContext.Provider;
