import { Router } from "mutraction-dom";
import { todoApp } from "./todo.js";
import { muLogo } from "./mulogo.js";
import { binding } from "./binding.js";
import { intro } from "./intro.js";
import { getStarted } from "./getStarted.js";

const about = (
    <>
        <h1>About</h1>
        <p>This is all about the stuff.</p>
    </>
);

const router = Router(
    { pattern: '#start', element: getStarted() },
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
                <ul style={{ position: "sticky", top: "1em", paddingLeft: "0" }}>
                    <li><a href="#">Introduction</a></li>
                    <li><a href="#start">Getting Started</a></li>
                    <li>
                        <details open={true}>
                            <summary><a>Topics</a></summary>
                            <ul>
                                <li>Model tracking</li>
                                <li>Dependencies</li>
                                <li>Property references</li>
                                <li>2-way binding</li>
                                <li>Change history</li>
                                <li>Transactions</li>
                            </ul>
                        </details>
                    </li>
                    <li>
                        <details open={true}>
                            <summary><a>Reference</a></summary>
                            <ul>
                                <li>mu:if / mu:else</li>
                                <li>mu:syncEvent</li>
                                <li>Property references</li>
                                <li>ForEach</li>
                                <li>ForEachPersist</li>
                                <li>track</li>
                                <li>Tracker</li>
                                <li>effect</li>
                                <li>Router</li>
                            </ul>
                        </details>
                    </li>
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
