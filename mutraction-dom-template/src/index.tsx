import { Router, track } from "mutraction-dom";
// import { todoApp } from "./todo.js";

// function welcome() {
    const [model1, tracker1] = track({ clicks: 0});
    const welcome1 = <div mu:tracker={tracker1}>
        <button onclick={() => ++model1.clicks }>+1</button>
        <p>Clicks: {model1.clicks}</p>
    </div>;

    const [model2, tracker2] = track({ clicks: 0});
    const welcome2 = <div mu:tracker={tracker2}>
        <button onclick={() => ++model2.clicks }>+1</button>
    <p>Clicks: {model2.clicks}</p>
</div>;
// }

const about = (
    <p>This is all about the stuff.</p>
);

const router = Router(
    { pattern: /#about$/, element: about },
    // { pattern: /#todo$/, element: todoApp },
    { pattern: /#id=(\d+)/, element: match => <>Id: {match[1]}</> },
    { pattern: /#w1/, element: welcome1 },
    { pattern: /#w2/, element: welcome2 },
    { element: welcome1 }
);

const app = <>
    <nav>
        <ul>
            <li><a href="#about">About</a></li>
            <li><a href="#todo">To-do</a></li>
            <li><a href="#id=234">Lookup</a></li>
        </ul>
    </nav>
    { router }
</>

document.getElementById("root")!.replaceChildren(app);
