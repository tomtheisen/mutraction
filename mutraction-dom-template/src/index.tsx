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

const nav = (
    <nav>
        <ul>
            <li><a href="#">Welcome</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#todo">To-do</a></li>
            <li><a href="#id=234">Lookup</a></li>
        </ul>
    </nav>
);

const router = Router(
    { pattern: '#about', element: about },
    { pattern: '#todo', element: todoApp },
    { pattern: /#id=(\d+)/, element: match => <>You can match: {match[1]}</> },
    { element: welcome }
);

document.getElementById("root")!.replaceChildren(nav, router);
