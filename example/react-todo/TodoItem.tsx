import * as React from "react";
import { TodoItemModel } from "./TodoItemModel.js";
import { items, itemsSync } from "./items.js";

function remove(item: TodoItemModel) {
    const index = items.indexOf(item);
    items.splice(index, 1);
}

export const TodoItem = itemsSync(function TodoItem({ item }: { item: TodoItemModel }) {
    const display = item.editing
        ? <span>
            <input value={ item.editingTitle } onChange={ ev => item.editingTitle = ev.target.value } />
            <button title="Apply" className="small" onClick={() => item.commit()}>✅</button>
            <button title="Cancel" className="small" onClick={() => item.cancel()}>❌</button>
        </span>
        : <span>
            <button title="Edit" className="small" onClick={() => item.startEditing()}>✏️</button>
            <button title="Delete" className="small" onClick={() => remove(item)}>❌</button>
            <label>
                <input type="checkbox" checked={item.done} onChange={ev => item.done = ev.target.checked} />
                <span className={ item.done ? "done" : "" }>{item.title}</span>
            </label>
        </span>;

    return <li>{display}</li>;
});
