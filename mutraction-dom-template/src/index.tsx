import { Router } from "mutraction-dom";
import { todoApp } from "./todo.js";
import { muLogo } from "./mulogo.js";
import { binding } from "./binding.js";
import { intro } from "./intro.js";

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
    { element: intro }
);

const app = (
    <>
        <header>
            <div style={{ position: "relative", top: "4px" }}>{ muLogo(50) }</div>
            <h1>traction</h1>
            <a href="https://github.com/tomtheisen/mutraction"><img src="assets/github-logo.svg" style={{height: "34px"}} /></a>
        </header>
        <div className="layout">
            <nav>
                <ul style={{ position: "sticky", top: "1em" }}>
                    <li><a href="#">Introduction</a></li>
                    <li><a href="#start">Getting Started</a></li>
                    <li><a href="#">Reference</a></li>
                    <li><a href="#">Introduction</a></li>
                    <li><a href="#">Introduction</a></li>
                    <li><a href="#">Introduction</a></li>
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
