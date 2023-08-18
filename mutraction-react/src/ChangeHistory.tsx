import { describeMutation } from 'mutraction';
import React, { FunctionComponent, useSyncExternalStore } from 'react';
import { useTrackerContext } from './TrackerContext.js';
import { key } from './key.js';

export const ChangeHistory: FunctionComponent = () => {
    const tracker = useTrackerContext();

    function subscribe(callback: () => void) {
        const subscription = tracker.subscribe(callback);
        return () => subscription.dispose();
    }
    useSyncExternalStore(subscribe, () => ({}));

    return <ol>{
        tracker.history.map(m => 
            <li key={ key(m) }>{ describeMutation(m) }</li>)
    }</ol>
};
