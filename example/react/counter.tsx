import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { trackAndSync } from 'mutraction-react';

const [model, sync] = trackAndSync({count: 0});

function increase() { ++model.count; }

const CountDisplay = sync(() => <p>Click count: {model.count}</p>);
const ClickButton = sync(() => <button onClick={increase}>+1</button>);

const App = sync(function App() {
    return <>
        <ClickButton />
        <CountDisplay />
    </>;
});

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
