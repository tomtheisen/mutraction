import React from 'react';
import { Tracker } from 'mutraction';
type SyncTreeProps = {
    tracker: Tracker;
    component?: React.FC;
    children?: React.FC;
};
export declare function SyncTree({ tracker, component, children }: SyncTreeProps): React.JSX.Element;
export {};
