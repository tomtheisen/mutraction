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
    return (
        <TrackerContext.Provider value={ tracker }>
            <Synced />
        </TrackerContext.Provider>
    );
}
