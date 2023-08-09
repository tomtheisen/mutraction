import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { SyncTree } from 'mutraction-react';
import { App } from './App.js';
import { tracker } from "./model.js";


const root = createRoot(document.getElementById('root')!);
root.render(
    <React.StrictMode>
        <SyncTree tracker={ tracker } component={ App } />
    </React.StrictMode>);
