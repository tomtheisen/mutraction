import { message } from "./message.js";
import { effect, track } from "mutraction";

const [model, tracker] = track({ message, arr: [1,2,3] });

effect(tracker, () => { console.log(model.message) });

const p = <p>lorem and stuff</p>;

function FuncComp({}) {
    return <>
        <p>Hello from FuncComp</p>
        <p>The message is: {model.message}</p>
    </>;
}

const div = (
    <main tracker={tracker}>
        <div>{ model.message }</div>
        <input value={ model.message } oninput={(ev) => model.message = (ev.target as any).value } />
        { p }
        <FuncComp />
        <p if={ model.message.length > 10 }>Long message alert</p>
        {model.arr}
        <button onclick={()=>model.arr.push(model.arr.length + 1)}>push</button>
    </main>
);

const root = document.getElementById("root")!;
root.replaceChildren(div);

model.message = "something else";
