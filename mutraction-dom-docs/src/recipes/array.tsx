import { ForEach } from "mutraction-dom";
import { codeSample } from "../codesample.jsx";

function ex1() {
    const elements = [
        <div>One thing</div>,
        <div>And another</div>
    ];

    const app = (
        <>
            <h3>Some items</h3>
            { ForEach(elements, e => e) }
        </>
    );

    return app;
}

export function array() {
    return (
        <>
            <h1>Dealing with arrays</h1>
            <p>
                In general, use <a href="#ref/ForEach"><code>ForEach</code></a> or <a href="#ref/ForEachPersist"><code>ForEachPersist</code></a>.
                You can also put an array directly into a <a href="#topics/jsx">JSX</a> expression.
                That will convert all the elements to strings, and join with commas.
                If, for some reason, you have an array of DOM elements, slap it in a <code>ForEach</code> like so.
            </p>
            { codeSample(`
                const elements = [
                    <div>One thing</div>,
                    <div>And another</div>
                ];

                const app = (
                    <>
                        <h3>Some items</h3>
                        { ForEach(elements, e => e) }
                    </>
                );
                `, ex1(), { sandboxLink: true, sandboxImports: ["ForEach"], docAppend: "app" }
            ) }
        </>
    );
}