import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { track } from 'mutraction';
import { TrackerContext, BoundInput, syncFromContext } from 'mutraction-react';

const [model, tracker] = track({ 
    first: "Donald", 
    last: "Duck",
    get full() { return `${this.first} ${this.last}` },
}, { deferNotifications: false });

const App = syncFromContext(function App() {
    return <main>
        <label>
            First: <BoundInput bindValue={ () => model.first } />
        </label>
        <label>
            Last: <BoundInput bindValue={ () => model.last } />
        </label>
        <hr/>
        <p>Full: { model.full }</p>
    </main>;
});

const root = createRoot(document.getElementById('root')!);
root.render(
    <TrackerContext.Provider value={ tracker }>
        <App />
    </TrackerContext.Provider>);
