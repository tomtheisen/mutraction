import React from 'react';
import { Tracker } from 'mutraction';
type MutrackProps = {
    tracker: Tracker;
    component: React.FC;
};
export declare function Mutrack({ tracker, component }: MutrackProps): React.JSX.Element;
export {};
