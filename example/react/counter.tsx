import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { track } from 'mutraction';
import { trackComponent } from 'mutraction-react';

let [model, tracker] = track({count: 0}, mut => console.log("model mutation", mut));

function increase() { ++model.count; }

const CountDisplay = trackComponent(tracker, () => <p>Click count: {model.count}</p>);
const ClickButton = trackComponent(tracker, () => <button onClick={increase}>+1</button>)

const App = trackComponent(tracker, function App() {
    return <>
        <ClickButton />
        <CountDisplay />
    </>;
});

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
