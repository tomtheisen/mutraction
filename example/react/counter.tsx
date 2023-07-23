// npx tsc; npx esbuild --bundle .\react\counter.js --sourcemap --outfile=.\react\counter_bundle.js

import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { track } from 'mutraction';
import { trackComponent } from 'mutraction-react';

let [model, tracker] = track({count: 0}, mut => console.log("model mutation", mut));

const App = 
trackComponent(React.useSyncExternalStore, tracker, 
    function App() {
        return <>
            tracked <button onClick={() => ++model.count}>{model.count}</button>
        </>;
    }
);

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
