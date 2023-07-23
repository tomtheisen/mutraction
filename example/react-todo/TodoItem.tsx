import * as React from "react";
import { TodoItemModel } from "./TodoItemModel.js";
import { itemsSync } from "./items.js";

export const TodoItem = itemsSync(function TodoItem({ item }: { item: TodoItemModel }) {
    const display = item.editing
        ? <span>
            <input value={ item.editingTitle } onChange={ ev => item.editingTitle = ev.target.value } />
            <button className="small" onClick={() => item.commit()}>✅</button>
            <button className="small" onClick={() => item.cancel()}>❌</button>
        </span>
        : <label>
            <input type="checkbox" checked={item.done} onChange={ev => item.done = ev.target.checked} />
            <button className="small" onClick={() => item.startEditing()}>✏️</button>
            <span className={ item.done ? "done" : "" }>{item.title}</span>
        </label>;

    return <li>{display}</li>;
});
