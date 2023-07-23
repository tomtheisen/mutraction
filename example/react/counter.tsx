import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { track } from 'mutraction';
import { trackComponent } from 'mutraction-react';

let [model, tracker] = track({count: 0}, mut => console.log("model mutation", mut));

const App = trackComponent(tracker, function App() {
    return <>
        tracked <button onClick={() => ++model.count}>{model.count}</button>
    </>;
});

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
