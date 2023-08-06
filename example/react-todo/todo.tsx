import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Mutrack } from 'mutraction-react';
import { App } from './App.js';
import { tracker } from "./items.js";


const root = createRoot(document.getElementById('root')!);
root.render(<Mutrack tracker={ tracker } component={ App } />);
