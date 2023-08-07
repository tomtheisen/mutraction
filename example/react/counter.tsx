import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { track } from 'mutraction';
import { SyncTree } from 'mutraction-react';

const [model, tracker] = track({ count: 0 });

function App() {
    return <>
        <button onClick={ () => ++model.count }>+1</button>
        <p>Click count: { model.count }</p>
    </>;
}

const root = createRoot(document.getElementById('root')!);
root.render(<SyncTree tracker={ tracker } component={ App } />);
