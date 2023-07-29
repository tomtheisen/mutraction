import { Tracker, describeMutation } from 'mutraction';
import * as React from 'react';

export const ChangeHistory: React.FC<{ tracker: Tracker }> = ({ tracker }) => {
    return <ol>
        {
            tracker.history.map(change => <li>{ describeMutation(change) }</li>)
        }
    </ol>
};
