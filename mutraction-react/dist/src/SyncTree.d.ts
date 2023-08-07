import React from 'react';
import { Tracker } from 'mutraction';
type SyncTreeProps = {
    tracker: Tracker;
    component: React.FC;
};
export declare function SyncTree({ tracker, component }: SyncTreeProps): React.JSX.Element;
export {};
