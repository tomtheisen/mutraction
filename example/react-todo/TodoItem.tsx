import * as React from "react";
import { TodoItemModel } from "./TodoItemModel.js";
import { items } from "./items.js";

function remove(item: TodoItemModel) {
    const index = items.indexOf(item);
    items.splice(index, 1);
}

export function TodoItem({ item }: { item: TodoItemModel }) {
    console.log("i wonder who's calling me? is someone tracking me?");

    const display = item.editing
        ? <span>
            <input value={ item.editingTitle } onChange={ ev => item.editingTitle = ev.target.value } />
            <button title="Apply" className="small" onClick={ () => item.saveTitle() }>✅</button>
            <button title="Cancel" className="small" onClick= {() => item.cancel() }>❌</button>
        </span>
        : <span>
            <button title="Delete" className="small" onClick={ () => remove(item) }>❌</button>
            <button title="Edit" className="small" onClick={ () => item.startEditing() }>✏️</button>
            <label>
                <input type="checkbox" checked={ item.done } onChange={ ev => item.done = ev.target.checked } />
                <span className={ item.done ? "done" : "" }>{ item.title }</span>
            </label>
        </span>;

    return <li>{ display }</li>;
}
