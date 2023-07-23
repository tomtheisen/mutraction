// npx tsc; npx esbuild --bundle --outfile=out\hooks\example_bundle.js .\out\hooks\example.js

import { track } from '../index';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { tracked } from './hook';

let [model, tracker] = track({count: 0}, mut => console.log("heard mutation", mut));

const App = tracked(tracker, function App() {
    const [count, setCount] = React.useState(0);

    // model.count = count;

    return <>
        useState <button onClick={() => setCount(c => c + 1)}>{count}</button>
        <br/>
        tracked <button onClick={() => ++model.count}>{model.count}</button>
    </>;
});

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
