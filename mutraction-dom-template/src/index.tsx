import { track } from "mutraction";
import { ForEachPersist } from "mutraction-dom";

type TodoItem = {
    title: string;
    done: boolean;
    editing: boolean;
}

function makeItem(title: string): TodoItem {
    return { title, done: false, editing: false };
}

function modelFactory() {
    return {
        newItemTitle: "",
        items: [] as TodoItem[],
    }
}

const [model, tracker] = track(modelFactory());

function todoItemRender(item: TodoItem) {
    return <li>{ item.title }</li>;
}

function doAdd(ev: SubmitEvent) {
    model.items.push(makeItem(model.newItemTitle));
    model.newItemTitle = "";
    ev.preventDefault();
}

// TODO: <FuncComp prop={ jsxProp } /> provides thunk

const app = (
    <div mu:tracker={tracker}>
        <h1 title={ model.newItemTitle }>To-do</h1>
        <ul>
            { ForEachPersist(model.items, item => todoItemRender(item)) }
        </ul>
        <form onsubmit={ doAdd }>
            <label>
                New item <input value={ model.newItemTitle }  oninput={ ev => model.newItemTitle = (ev.target as any).value } />
            </label>
            <button>New item</button>
        </form>
    </div>
);

document.getElementById("root")!.replaceChildren(app);
