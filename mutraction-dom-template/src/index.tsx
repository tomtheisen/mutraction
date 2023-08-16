import { message } from "./message.js";
import { effect, track } from "mutraction";
import { ForEach, ForEachPersist } from "mutraction-dom";

const [model, tracker] = track({ message, arr: [{current:1},{current:2},{current:3},] });

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
        <button onclick={()=>model.arr.push({current: model.arr.length + 1})}>push</button>
        <button onclick={()=>model.arr.pop()}>pop</button>
        <button onclick={()=>model.arr.reverse()}>rev</button>

        <ol>
            { ForEach(model.arr, e=><li>{ e.current * 9 }<input /></li>) }
        </ol>
        <ol>
            { ForEachPersist(model.arr, e=><li>{ e.current * 9 }<input /></li>) }
        </ol>
    </main>
);

const root = document.getElementById("root")!;
root.replaceChildren(div);

model.message = "something else";
