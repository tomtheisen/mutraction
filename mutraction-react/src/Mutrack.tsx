import React from 'react';
import { Tracker } from 'mutraction';
import { syncFromContext } from './syncFromTracker.js';
import { TrackerContext } from './TrackerContext.js';

type MutrackProps = {
    tracker: Tracker;
    component: React.FC;
};
export function Mutrack({ tracker, component }: MutrackProps) {
    const Synced = syncFromContext(component);

    // @ts-ignore The type checker is complaining about missing private members that shouldn't be part of the exported type.
    return <TrackerContext.Provider value={ tracker }><Synced /></TrackerContext.Provider>;
}
