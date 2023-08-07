import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { track } from 'mutraction';
import { BoundInput, SyncTree } from 'mutraction-react';

const [model, tracker] = track({ 
    first: "Donald", 
    last: "Duck",
    get full() { return `${this.first} ${this.last}` },
});

function App() {
    return <main>
        First: <BoundInput bindValue={ () => model.first } />
        <br />
        Last: <BoundInput bindValue={ () => model.last } />
        <hr/>
        Full: { model.full }
    </main>;
};

const root = createRoot(document.getElementById('root')!);
root.render(<SyncTree tracker={ tracker } component={ App } />);
