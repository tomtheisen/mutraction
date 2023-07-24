import * as React from "react";
import { items, tracker } from "./items.js";
import { TodoItemModel } from "./TodoItemModel.js";

export function AddItem() {
    // you can still use other hooks, such as the infamous `useState`
    const [title, setTitle] = React.useState("");

    function doAdd(ev: React.SyntheticEvent) {
        setTitle("");
        tracker.startTransaction();
        items.push(new TodoItemModel(title));
        tracker.commit();
        ev.preventDefault();
    }

    return <form onSubmit={ doAdd }>
        <label>
            New item:
            <input value={title} onChange={ ev => setTitle(ev.target.value) } />
        </label>
        <button onClick={ doAdd }>Add</button>
    </form>
}

