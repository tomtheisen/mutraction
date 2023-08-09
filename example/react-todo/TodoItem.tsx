import * as React from "react";
import { model, TodoItem } from "./model.js";
import { BoundInput, BoundCheckbox } from "mutraction-react";
import { isTracked } from "mutraction";

function remove(item: TodoItem) {
    const index = model.items.indexOf(item);
    model.items.splice(index, 1);
}

function startEditing(item: TodoItem) {
    item.editing = true;
    item.editingTitle = item.title;
}

function saveTitle(item: TodoItem) {
    item.editing = false;
    item.title = item.editingTitle ?? "";
}

function cancel(item: TodoItem) {
    item.editing = false;
}

export function TodoItem({ item }: { item: TodoItem }) {
    const display = item.editing
        ? <span>
            <BoundInput bindValue={ () => item.editingTitle } />
            <button title="Apply"  className="small" onClick={ () => saveTitle(item)    }>✅</button>
            <button title="Cancel" className="small" onClick={ () => cancel(item)       }>❌</button>
        </span>
        : <span>
            <button title="Delete" className="small" onClick={ () => remove(item)       }>❌</button>
            <button title="Edit"   className="small" onClick={ () => startEditing(item) }>✏️</button>
            <label>
                <BoundCheckbox bindChecked={ () => item.done } />
                <span className={ item.done ? "done" : "" }>{ item.title }</span>
            </label>
        </span>;

    return <li>{ display }</li>;
}
