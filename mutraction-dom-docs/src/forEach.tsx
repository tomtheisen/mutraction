import { ForEach, track } from "mutraction-dom";
import { codeSample } from "./codesample.js";

function ex1() {
    const model = track(["apple", "banana", "cherry"]);

    const app = (
        <>
            <ul>
                { ForEach(model, item => <li>Fruit: { item }</li>) }
            </ul>
            <button onclick={() => model.push("date") }>
                Add "date"
            </button>
        </>
    );

    return app;
}

export function forEach() {
    return (
        <>
            <h1><code>ForEach</code></h1>
            <p>
                <code>ForEach</code> is a function that provides a convenient way to turn
                dynamic arrays into DOM elements.  It accepts an array, and a mapping function as input.
            </p>
            { codeSample(`
                const model = track(["apple", "banana", "cherry"]);

                const app = (
                    <>
                        <ul>
                            { ForEach(model, item => <li>Fruit: { item }</li>) }
                        </ul>
                        <button onclick={() => model.push("date") }>
                            Add "date"
                        </button>
                    </>
                );
                `, ex1()
            ) }

        </>
    )
}