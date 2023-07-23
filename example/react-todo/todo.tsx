import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { trackAndSync, key } from 'mutraction-react';

class TodoItemModel {
    title: string;
    done = false;

    constructor(title: string) {
        this.title = title;
    }
}

const [items, sync] = trackAndSync([] as TodoItemModel[]);

function AddItem() {
    // you can still use other hooks, such as the infamous `useState`
    const [title, setTitle] = React.useState("");

    function doAdd(title: string) {
        setTitle("");
        items.push(new TodoItemModel(title));
    }

    return <div>
        <label>
            New item:
            <input value={title} onChange={ ev => setTitle(ev.target.value) } />
        </label>
        <button onClick={ () => doAdd(title) }>Add</button>
    </div>
}

const TodoItem = sync(function TodoItem({ item }: { item: TodoItemModel }) {
    return <li>
        <label>
            <input type="checkbox" checked={item.done} onChange={ev => item.done = ev.target.checked} />
            <span className={ item.done ? "done" : "" }>{item.title}</span>
        </label>
    </li>;
});

function moveFinishedToBottom() {
    items.sort((a, b) => Number(b) - Number(a));
}

const SortItems = sync(function SortItems() {
    return <div>
        <button onClick={moveFinishedToBottom}>
            Move finished to bottom
        </button>
    </div>;
});

const App = sync(function App() {
    return <div>
        <h1>To-do List</h1>
        <ul>
            {
                items.map(e => <TodoItem item={e} key={key(e)} />)
            }
        </ul>
        <AddItem />
        <SortItems />
    </div>
});

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
