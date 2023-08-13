import { message } from "./message.js";
import { effect, track } from "mutraction";
// import type { JSX } from "mutraction-dom/jsx-runtime";

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
    <main mu:tracker={tracker}>
        <div>{ model.message }</div>
        <input value={ model.message } oninput={(ev) => model.message = (ev.target as any).value } />
        { p }
        <FuncComp />
        { model.arr }
        { "asdf" }
        <p mu:if={ model.message.length > 10 }>Long message alert</p>
        <button onclick={()=>model.arr.push(model.arr.length + 1)}>push</button>
    </main>
);

const root = document.getElementById("root")!;
root.replaceChildren(div);

model.message = "something else";
