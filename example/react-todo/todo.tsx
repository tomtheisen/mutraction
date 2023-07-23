import * as React from 'react';
import { createRoot } from 'react-dom/client';

import { TodoItemModel } from './TodoItemModel.js';
import { items } from './items.js';
import { App } from './App.js';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

// Normally, I'd populate these before rendering, but you don't have to.
items.push(
    new TodoItemModel("Get some groceries"),
    new TodoItemModel("Feed the cat"),
    new TodoItemModel("Track some mutations"));
