import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { track } from 'mutraction';
import { Mutrack } from 'mutraction-react';

const [model, tracker] = track({ count: 0 });

function increase() { ++model.count; }

function App() {
    return <>
        <button onClick={ increase }>+1</button>
        <p>Click count: { model.count }</p>
    </>;
}

const root = createRoot(document.getElementById('root')!);
root.render(<Mutrack tracker={ tracker } component={ App } />);
