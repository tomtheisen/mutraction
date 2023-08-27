import { codeSample } from "./codesample.js";

function ex1() {
    const app = <button onclick={ () => alert("Hello") }>Click</button>;
    return app;
}

export function events() {
    return (
        <>
            <h1>Events</h1>
            <p>
                Mutraction doesn't provide any synthetic events.
                Standard <a href="https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement#events">DOM events</a> can 
                be subscribed in <a href="#topics/jsx">JSX</a> using the <code>on…</code> properties.
            </p>
            { codeSample(`
                const app = <button onclick={ () => alert("Hello") }>Click</button>;
                `, ex1(), { sandboxLink: true, docAppend: "app" }
            ) }

        </>
    )
}
