import { track, Swapper } from "mutraction-dom";
import { codeSample } from "../codesample.js";

function ex1() {
    const model = track({ type: "" });

    function getUI() {
        switch(model.type) {
            case "list":
                return <ol><li>first</li><li>second</li><li>third</li></ol>
            case "para":
                return <p>Lorem ipsum dolor</p>
            default:
                return <div>Unknown</div>;
        }
    }

    const app = 
        <>
            <button onclick={ () => model.type = "list" }>Use list</button>
            <button onclick={ () => model.type = "para" }>Use paragraph</button>
            <div mu:if={ model.type !== "" }>{ getUI() }</div>
        </>;

    return app;
}

function ex2() {
    const model = track({ type: "" });

    function getUI() {
        switch(model.type) {
            case "list":
                return <ol><li>first</li><li>second</li><li>third</li></ol>
            case "para":
                return <p>Lorem ipsum dolor</p>
            default:
                return <div>Unknown</div>;
        }
    }

    const app = 
        <>
            <button onclick={ () => model.type = "list" }>Use list</button>
            <button onclick={ () => model.type = "para" }>Use paragraph</button>
            <div mu:if={ model.type !== "" }>{ Swapper(getUI) }</div>
        </>;

    return app;
}

export function swapper() {
    return <>
        <h1><code>Swapper()</code></h1>
        <p>
            The purpose of <code>Swapper</code> is to dynamically replace an entire node when its dependencies change.
            Normally, mutraction synchronizes node attributes and text children.
            It doesn't replace element nodes unless explicitly instructed.
            And most of the time, this is probably what you want.
            But for the other times, there's <code>Swapper</code>.
            For instance, this comes up in recursive structures like folder browsers.
        </p>
        <p>
            For simple cases, you might be able to use <a href="#ref/ifelse"><code>mu:if / mu:else</code></a> instead.
        </p>

        <h2>Arguments</h2>
        <ul>
            <li>
                <code>nodeFactory</code>
                <p>
                    This is a function that produces a document node.
                    Whenever a tracked dependency of the function changes, the resulting node is replaced.
                </p>
                <p>
                    This function can either return a DOM node or an options object.
                </p>
                <ul>
                    <li><code>node</code> is the output node.</li>
                    <li><code>cleanup</code> is an optional callback to invoke when replacing the previous node.</li>
                </ul>
            </li>
        </ul>

        <h2>The problem</h2>
        <p>
            The selected UI only changes once.  Further changes aren't reflected.
        </p>
        { codeSample(`
            const model = track({ type: "" });

            function getUI() {
                switch(model.type) {
                    case "list":
                        return <ol><li>first</li><li>second</li><li>third</li></ol>
                    case "para":
                        return <p>Lorem ipsum dolor</p>
                    default:
                        return <div>Unknown</div>;
                }
            }

            const app = 
                <>
                    <button onclick={ () => model.type = "list" }>Use list</button>
                    <button onclick={ () => model.type = "para" }>Use paragraph</button>
                    <div mu:if={ model.type !== "" }>{ getUI() }</div>
                </>;
            `, ex1(),  { docAppend: "app", sandboxImports: ["track"], sandboxLink: true }
        ) }

        <h2>The solution</h2>
        <p>
            Use <code>Swapper</code>.
        </p>
        { codeSample(`
            const model = track({ type: "" });

            function getUI() {
                switch(model.type) {
                    case "list":
                        return <ol><li>first</li><li>second</li><li>third</li></ol>
                    case "para":
                        return <p>Lorem ipsum dolor</p>
                    default:
                        return <div>Unknown</div>;
                }
            }

            const app = 
                <>
                    <button onclick={ () => model.type = "list" }>Use list</button>
                    <button onclick={ () => model.type = "para" }>Use paragraph</button>
                    <div mu:if={ model.type !== "" }>{ Swapper(getUI) }</div>
                </>;
            `, ex2(), { docAppend: "app", sandboxImports: ["track", "Swapper"], sandboxLink: true }
        ) }
    </>;
}