// npx tsc; npx esbuild --bundle --outfile=out\hooks\example_bundle.js .\out\hooks\example.js

import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { track } from '../index';
import { trackComponent } from './hook';

let [model, tracker] = track({count: 0}, mut => console.log("model mutation", mut));

const App = trackComponent(tracker, function App() {
    return <>
        tracked <button onClick={() => ++model.count}>{model.count}</button>
    </>;
});

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
