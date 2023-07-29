import { Tracker, describeMutation } from 'mutraction';
import * as React from 'react';
import { key } from './key.js';

export const ChangeHistory: React.FC<{ tracker: Tracker }> = ({ tracker }) => {
    function subscribe(callback: () => void) {
        const subscription = tracker.subscribe(callback);
        return () => subscription.dispose();
    }
    React.useSyncExternalStore(subscribe, () => tracker.generation);

    return <ol>
        {
            tracker.history.map(change => 
                <li key={ key(change) }>{ describeMutation(change) }</li>)
        }
    </ol>
};
