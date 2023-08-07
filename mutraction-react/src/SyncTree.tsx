import React from 'react';
import { Tracker } from 'mutraction';
import { sync } from './sync.js';
import { TrackerContext } from './TrackerContext.js';

type SyncTreeProps = {
    tracker: Tracker;
    component: React.FC;
};
export function SyncTree({ tracker, component }: SyncTreeProps) {
    const Synced = sync(component);

    // @ts-ignore The type checker is complaining about missing private members that shouldn't be part of the exported type.
    return <TrackerContext.Provider value={ tracker }><Synced /></TrackerContext.Provider>;
}
