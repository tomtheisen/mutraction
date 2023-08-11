import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { track } from 'mutraction';
import { SyncTree } from 'mutraction-react';

// state can live outside components
const [model, tracker] = track({ count: 0 });

const root = createRoot(document.getElementById('root')!);
// Here's where the magic happens. SyncTree wires up all 
// of its descendants to listen for changes from the tracker.
root.render(
    <SyncTree tracker={ tracker }>{() =>
        <>
            <button onClick={ () => ++model.count }>+1</button>
            <p>Click count: { model.count }</p>
        </>
    }</SyncTree>);
