import * as React from "react";
import { model } from "./model.js";
import { SortItems } from "./SortItems.js";
import { TodoItem } from "./TodoItem.js";
import { AddItem } from "./AddItem.js";
import { TimeTravel } from "./TimeTravel.js";
import { key, ChangeHistory } from "mutraction-react";
import { ModelVisualizer } from "./ModelVisualizer.js";

export function App() {
    return <main>
        <h1>To-do List</h1>
        <SortItems />
        <ul>
            { model.items.map(e => <TodoItem item={ e } key={ key(e) } />) }
        </ul>
        <AddItem />
        <hr />
        <TimeTravel />
        <div id="inspect">
            <div>
                <h2>Raw Model</h2>
                <ModelVisualizer value={ model } />
            </div>
            <div>
                <h2>History</h2>
                <ChangeHistory />
            </div>
        </div>
    </main>;
}

