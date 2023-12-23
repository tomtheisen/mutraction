import { ForEach, /*ForEachPersist,*/ track } from "mutraction-dom";
import { codeSample } from "../codesample.js";

function ex1() {
    const model = track([{ label: "X" }, { label: "Y" }, { label: "Z" }]);

    const app = (
        // <>
        //     <ul>
        //         { ForEachPersist(model, item => <li>{ item.label } <input /></li>) }
        //     </ul>
            <button onclick={() => model.reverse() }>
                Reverse
            </button>
        // </>
    );

    return app;
}

export function forEachPersist() {
    return (
        <>
            <h1><code>ForEachPersist()</code></h1>
            <p>
                <code>ForEachPersist</code> is similar to its cousin <code>ForEach</code>.  
                In many cases, it behaves identically.  The main difference between the two
                is that <code>ForEachPersist</code> will retain DOM elements for each array member,
                even if the item changes position in the array.
            </p>

            <p>
                Another difference is that the mapping function accepts only a single argument.
                It does not get the array index or the entire array.  This is because the array index
                may change without re-invoking the function.
            </p>

            <p>
                The trade-off is that the array elements <em>must</em> be objects.
                It's not necessary to specify a key property.  Object reference identity
                serves to identify each object.
            </p>

            <h2>Arguments</h2>
            <ul>
                <li>
                    <code>items</code>
                    <p>
                        This is the array of items to be mapped into DOM nodes.
                        It must be an array of objects, not primitives.
                    </p>
                    <p>
                        You can also use a function returning an array of items.  If you do this,
                        replacing the array itself will be tracked also.
                    </p>
                </li>
                <li>
                    <code>mapFunction</code>
                    <p>
                        This is a function that converts each item into a DOM node.
                        It will be called repeatedly to convert each item.
                        As items are replaced or added to the array, it will be called again.
                        It will never be called more than once for each item.
                    </p>
                </li>
            </ul>

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
                `, ex1(), { sandboxLink: true, sandboxImports: ["track", "ForEachPersist"], docAppend: "app" }
            ) }

        </>
    )
}