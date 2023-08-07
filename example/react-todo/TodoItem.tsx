import * as React from "react";
import { TodoItemModel } from "./TodoItemModel.js";
import { items } from "./items.js";
import { BoundInput, BoundCheckbox } from "mutraction-react";

function remove(item: TodoItemModel) {
    const index = items.indexOf(item);
    items.splice(index, 1);
}

export function TodoItem({ item }: { item: TodoItemModel }) {
    const display = item.editing
        ? <span>
            <BoundInput bindValue={ () => item.editingTitle } />
            <button title="Apply"  className="small" onClick={ () => item.saveTitle()    }>✅</button>
            <button title="Cancel" className="small" onClick={ () => item.cancel()       }>❌</button>
        </span>
        : <span>
            <button title="Delete" className="small" onClick={ () => remove(item)        }>❌</button>
            <button title="Edit"   className="small" onClick={ () => item.startEditing() }>✏️</button>
            <label>
                <BoundCheckbox bindChecked={ () => item.done } />
                <span className={ item.done ? "done" : "" }>{ item.title }</span>
            </label>
        </span>;

    return <li>{ display }</li>;
}
