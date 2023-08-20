import { track, Router } from "mutraction-dom";
import { todoApp } from "./todo.js";
import { muLogo } from "./mulogo.js";
import { binding } from "./binding.js";

function dedent(s: string) {
    const prefix = /\n[ \t]*$/.exec(s)!;
    return s.replaceAll(prefix[0], "\n").trim();
}

function welcome() {
    const model = track({ clicks: 0});

    return <div>
        <h1>Mutraction</h1>
        <h2>Reactive UI in Typescript and JSX</h2>
        <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Optio quas, corporis delectus quos, velit eaque molestias natus vitae culpa, assumenda eveniet quis dolor excepturi aliquam repudiandae! Quisquam a quam quasi!</p>
        <figure>
            <code>
                {dedent(`
                const model = track({ clicks: 0});
                <button onclick={() => ++model.clicks }>+1</button>
                <p>Clicks: {model.clicks}</p>                
                `)}
            </code>
            <output>
                <button onclick={() => ++model.clicks }>+1</button>
                Clicks: {model.clicks}
            </output>
        </figure>
    </div>;
}

const about = (
    <>
        <h1>About</h1>
        <p>This is all about the stuff.</p>
    </>
);

const router = Router(
    { pattern: '#about', element: about },
    { pattern: '#todo', element: todoApp },
    { pattern: /#id=(\d+)/, element: match => <>You can match: {match[1]}</> },
    { pattern: '#2way', element: binding() },
    { pattern: /#.+/, element: match => <>No route found for {match[0]}</> },
    { element: welcome }
);

const app = (
    <>
        <header>
            <h1><span className="primary" style={{fontStyle: "italic"}}>μ</span>traction</h1>
            { muLogo(50) }
            <a href="https://github.com/tomtheisen/mutraction"><img src="assets/github-logo.svg" style={{height: "34px"}} /></a>
        </header>
        <div className="layout">
            <nav>
                <ul style={{ position: "sticky", top: "1em" }}>
                    <li><a href="#">Welcome</a></li>
                    <li><a href="#about">About</a></li>
                    <li><a href="#todo">To-do</a></li>
                    <li><a href="#2way">Two way</a></li>
                    <li><a href="#id=234">Lookup</a></li>
                </ul>
            </nav>
            <main>
                <div style={{ maxWidth: "960px",  margin: "0 auto" }}>
                    { router }
                </div>
            </main>
        </div>
    </>
);

document.body.append(app);
