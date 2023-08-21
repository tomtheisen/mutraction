import { ForEach, ForEachPersist, track } from "mutraction-dom";
import { codeSample } from "./codesample.js";

function ex1() {
    const model = track([{ label: "X" }, { label: "Y" }, { label: "Z" }]);

    const app = (
        <>
            <ul>
                { ForEachPersist(model, item => <li>{ item.label } <input /></li>) }
            </ul>
            <button onclick={() => model.reverse() }>
                Reverse
            </button>
        </>
    );

    return app;
}

export function forEachPersist() {
    return (
        <>
            <h1><code>ForEachPersist</code></h1>
            <p>
                <code>ForEachPersist</code> is similar to its cousin <code>ForEach</code>.  
                In many cases, it behaves identically.  The main difference between the two
                is that <code>ForEachPersist</code> will retain DOM elements for each array member,
                even if the item changes position in the array.
            </p>

            <p>
                The trade-off is that the array elements <em>must</em> be objects.
                It's not necessary to specify a key property.  Object reference identity
                serves to identify each object.
            </p>

            <p>
                In the following example, note that the <code>&lt;input&gt;</code>s have no
                model properties assigned.  Try entering values in the, and reversing the array.
                The values in the <code>&lt;input&gt;</code>s also appear to be reversed, because
                the DOM elements are preserved.  The values are not stored in any other variables.
            </p>

            { codeSample(`
                const model = track([{ label: "X" }, { label: "Y" }, { label: "Z" }]);

                const app = (
                    <>
                        <ul>
                            { ForEachPersist(model, item => <li>{ item.label } <input /></li>) }
                        </ul>
                        <button onclick={() => model.reverse() }>
                            Reverse
                        </button>
                    </>
                );
                `, ex1()
            ) }

        </>
    )
}