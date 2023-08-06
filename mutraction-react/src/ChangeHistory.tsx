import { Tracker, describeMutation } from 'mutraction';
import React, { FunctionComponent, useSyncExternalStore } from 'react';
import { key } from './key.js';

export const ChangeHistory: FunctionComponent<{ tracker: Tracker }> = ({ tracker }) => {
    function subscribe(callback: () => void) {
        const subscription = tracker.subscribe(callback);
        return () => subscription.dispose();
    }
    useSyncExternalStore(subscribe, () => tracker.generation);

    return <ol>{
        tracker.history.map(m => 
            <li key={ key(m) }>{ describeMutation(m) }</li>)
    }</ol>
};
