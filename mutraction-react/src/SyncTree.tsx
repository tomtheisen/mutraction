import React from 'react';
import { Tracker } from 'mutraction';
import { sync } from './sync.js';
import { TrackerContext } from './TrackerContext.js';

type SyncTreeProps = {
    tracker: Tracker;
    component?: React.FC;
    children?: React.FC;
};
export function SyncTree({ tracker, component, children }: SyncTreeProps) {
    component ??= children;
    if (typeof component !== 'function')
        throw Error("SyncTree requires either a 'component' prop or a single child that is a function component")
    const Synced = sync(component ?? children);

    // @ts-ignore The type checker is complaining about missing private members that shouldn't be part of the exported type.
    return <TrackerContext.Provider value={ tracker }><Synced /></TrackerContext.Provider>;
}
