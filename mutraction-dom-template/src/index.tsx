import { track, Router } from "mutraction-dom";
import { todoApp } from "./todo.js";
import { mu } from "./mulogo.js";

function welcome() {
    const model = track({ clicks: 0});
    return <div>
        <button onclick={() => ++model.clicks }>+1</button>
        <p>Clicks: {model.clicks}</p>
    </div>;
}

const about = (
    <>
        <h1>About</h1>
        <p>This is all about the stuff.</p>
    </>
);

function twoWay() {
    const model = track({ text: "", scrollPos: 0 });

    return (
        <>
            <div>
                <input mu:syncEvent="input" maxLength={10} value={ model.text } />
                <input mu:syncEvent="input" maxLength={10} value={ model.text } />
            </div>
            <div>Scroll pos: {model.scrollPos}</div>
            <div mu:syncEvent="scroll" scrollTop={model.scrollPos} style={{overflow: "scroll", maxHeight: "100px"}}>
                <div style={{height: "200px"}}></div>
            </div>
        </>
    );
}

const nav = (
    <nav>
        <ul>
            <li><a href="#">Welcome</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#todo">To-do</a></li>
            <li><a href="#2way">Two way</a></li>
            <li><a href="#id=234">Lookup</a></li>
        </ul>
    </nav>
);

const router = Router(
    { pattern: '#about', element: about },
    { pattern: '#todo', element: todoApp },
    { pattern: /#id=(\d+)/, element: match => <>You can match: {match[1]}</> },
    { pattern: '#2way', element: twoWay() },
    { pattern: /#.+/, element: match => <>No route found for {match[0]}</> },
    { element: welcome }
);

document.getElementById("root")!.replaceChildren(nav, router, mu);
