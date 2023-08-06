import React from 'react';
import { Tracker } from 'mutraction';
import { syncFromContext } from './syncFromTracker.js';
import { TrackerContext } from './TrackerContext.js';

type MutrackProps = {
    tracker: Tracker;
    children: any;
};
export function Mutrack({ tracker, children }: MutrackProps) {
    // The result of syncFromContext is a component. (higher order)
    // But you can't use it as a JSX element without assigning it to a capitalized identifier.
    // So we just use createElement().
    return (
        <TrackerContext.Provider value={ tracker }>
            { React.createElement(syncFromContext(() => children)) }
        </TrackerContext.Provider>
    );
}
