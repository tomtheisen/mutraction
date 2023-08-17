import { track } from "mutraction";
import { ForEachPersist } from "mutraction-dom";

type TodoItem = ReturnType<typeof makeItem>;

function makeItem(title: string) {
    return { title, done: false, editing: false };
}

const [model, tracker] = track({
    newItemTitle: "",
    items: [] as TodoItem[],
});

function itemRender(item: TodoItem) {
    return <li>
        <input type="checkbox" checked={ item.done } onchange={ ev => item.done = (ev.target as any).checked } />
        { item.title }
        <span mu:if={ item.done }>Done</span>
    </li>;
}

function doAdd(ev: SubmitEvent) {
    model.items.push(makeItem(model.newItemTitle));
    model.newItemTitle = "";
    ev.preventDefault();
}

const app = (
    <div mu:tracker={ tracker }>
        <h1 title={ model.newItemTitle }>To-do</h1>
        <ul>
            { ForEachPersist(model.items, item => itemRender(item)) }
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
