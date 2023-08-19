import { track, Router } from "mutraction-dom";
import { todoApp } from "./todo.js";

function welcome() {
    const model = track({ clicks: 0});
    return <div>
        <button onclick={() => ++model.clicks }>+1</button>
        <p>Clicks: {model.clicks}</p>
    </div>;
}

const about = (
    <p>This is all about the stuff.</p>
);

const router = Router(
    { pattern: /#about$/, element: about },
    { pattern: /#todo$/, element: todoApp },
    { pattern: /#id=(\d+)/, element: match => <>Id: {match[1]}</> },
    { element: welcome }
);

const app = <>
    <nav>
        <ul>
            <li><a href="#about" id="about">About</a></li>
            <li><a href="#todo">To-do</a></li>
            <li><a href="#id=234">Lookup</a></li>
        </ul>
    </nav>
    { router }
</>

document.getElementById("root")!.replaceChildren(app);
