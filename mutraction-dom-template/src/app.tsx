import { effect, track, ForEachPersist } from "mutraction-dom";

type TodoItem = ReturnType<typeof makeItem>;
function makeItem(title: string) {
    return { title, done: false, editing: false };
}
const [model, tracker] = track({
    newItemTitle: "",
    items: [] as TodoItem[],
});
function remove(item: TodoItem) {
    const idx = model.items.indexOf(item);
    if (idx >= 0) model.items.splice(idx, 1);
}
function itemRender(item: TodoItem) {
    const editor = document.createElement("input");
    effect(tracker, () => { editor.value = item.title; });

    return <>
        <li mu:if={!item.editing}>
            <button onclick={() => remove(item)}>❌</button>
            <button onclick={() => item.editing = true}>✏️</button>
            <label>
                <input type="checkbox" checked={item.done} onchange={ev => item.done = (ev.target as any).checked} />
                <span style={{ textDecoration: item.done ? "line-through" : "none" }}>{item.title}</span>
            </label>
        </li>
        <li mu:else>
            {editor}
            <button onclick={() => (item.title = editor.value, item.editing = false)}>✅</button>
            <button onclick={() => item.editing = false}>❌</button>
        </li>
    </>;
}
function doAdd(ev: SubmitEvent) {
    model.items.push(makeItem(model.newItemTitle));
    model.newItemTitle = "";
    ev.preventDefault();
}
function sort() {
    model.items.sort((a, b) => Number(a.done) - Number(b.done));
}
export const app = (
    <div mu:tracker={tracker}>
        <h1 title={model.newItemTitle}>To-do</h1>
        <button onclick={sort}>Sort by unfinished</button>
        <ul>
            {ForEachPersist(model.items, item => itemRender(item))}
        </ul>
        <form onsubmit={doAdd}>
            <label>
                New item <input value={model.newItemTitle} oninput={ev => model.newItemTitle = (ev.target as any).value} />
            </label>
            <button>New item</button>
        </form>
        <a href="#about">About</a>
    </div>
);
