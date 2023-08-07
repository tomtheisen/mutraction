import * as React from "react";
import { model } from "./model.js";
import { SortItems } from "./SortItems.js";
import { TodoItem } from "./TodoItem.js";
import { AddItem } from "./AddItem.js";
import { UndoButton } from "./UndoButton.js";
import { key, ChangeHistory } from "mutraction-react";

export function App() {
    return <main>
        <h1>To-do List</h1>
        <SortItems />
        <ul>
            { model.items.map(e => <TodoItem item={ e } key={ key(e) } />) }
        </ul>
        <AddItem />
        <h2>History</h2>
        <UndoButton />
        <ChangeHistory />
    </main>;
}

