import * as React from "react";
import { items, tracker, itemsSync } from "./items.js";
import { SortItems } from "./SortItems.js";
import { TodoItem } from "./TodoItem.js";
import { AddItem } from "./AddItem.js";
import { key, ChangeHistory } from "mutraction-react";
import { UndoButton } from "./UndoButton.js";

export const App = itemsSync(function App() {
    return <div>
        <h1>To-do List</h1>
        <SortItems />
        <ul>
            { items.map(e => <TodoItem item={ e } key={ key(e) } />) }
        </ul>
        <AddItem />
        <h2>History</h2>
        <UndoButton />
        <ChangeHistory tracker={ tracker } />
    </div>
});

