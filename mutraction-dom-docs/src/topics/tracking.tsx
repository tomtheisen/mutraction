import { codeSample } from "../codesample.js";

export const tracking = (
    <>
        <h1>Model tracking</h1>
        <p>
            The central premise of mutraction is that property changes are <em>observable</em>.
            This means that it's possible to subscribe to a particular object property and be notified when it changes.
            It's similar in concept to an event, although the implementation details differ.
            So code that <em>reads</em> an object property is automatically notified when other code <em>writes</em> that property.
        </p>
        { codeSample(`
            // wrap model in a tracking proxy
            const model = track({ current: "foo" });
            
            // invoke and subscribe to tracked property reads
            // re-invoke whenever any of them change
            effect(() => {
                console.log("current:", model.current);
            });

            // write to dependcy triggering the effect re-invocation
            model.current = "bar";
            `,
            <>
                current: foo<br />
                current: bar
            </>, { sandboxLink: true, sandboxImports: ["track", "effect"] }
        ) }
        <p>
            One consequence of this is that the root tracked value must be an object, not a primitive.
            This means that you cannot directly track a number or string.
        </p>

        <h2>How does it work?</h2>
        <p>
            <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy">Proxies</a> allow 
            the injection of arbitrary behavior on property reads, writes, and deletes (among other things).
            This allows for property reads to create subscriptions and property mutations to notify those subscribers.
        </p>
        <p>
            This works well enough for a single object, but what if the state model is a deeply nested object?
            The proxy is also "viral".  
            Any read or write involving an object value will ensure the target object is also wrapped in a proxy if it isn't already.
            This way, if you proxy the root object, the rest of the object graph will automatically get lazily proxied.
        </p>

        <h2>What about arrays?</h2>
        <p>
            ECMAScript specifies that arrays are <a href="https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-array-exotic-objects">"exotic objects."</a> This 
            means that writing to the <code>length</code> property can silently change which elements are in the array.
            It also means that writing a new element to an out-of-bounds index silently changes the <code>length</code> property.
            Mutraction is aware of the special behaviors of arrays, and handles them correctly.
            This means you can mutate arrays in place without taking any special 
            precautions. <code>push()</code> to your heart's content.  The other mutating array methods are handled as well.
        </p>
        { codeSample(`
            const model = track([]);

            effect(() => {
              console.log("length:", model.length);
            });

            model[57] = "foo";
            `,
            <>
                length: 0<br />
                length: 58
            </>, { sandboxLink: true, sandboxImports: ["track", "effect"] }
        ) }

        <h2>What about the other exotic objects?</h2>
        <p>
            ECMAScript specifies a small handful of other exotic object types:
        </p>
        <ol>
            <li>Strings</li>
            <li>Arguments objects</li>
            <li>Integer-Indexed objects</li>
            <li>Module Namespaces</li>
            <li>Immutable Prototype objects</li>
        </ol>
        <p>
            Strings don't pose a problem because they're immutable.  When you write <code>str += "abc"</code>,
            you're creating a new string.  The original string is unmodified.
            So the exotic behavior of strings doesn't affect mutraction.
        </p>
        <p>
            Mutraction makes no effort to support the remainder of the exotic objects.
            Maybe some day it might.
        </p>

        <h2>Anything else?</h2>
        <p>
            <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise">Promises</a>.
            They're not categorized as "exotic" objects, but they still don't work with the tracking proxy.
            In particular, promise resolution explicitly checks that the <code>this</code> reference is not a proxy.
            For mutraction, this is not a problem.  Mutraction treats promises as opaque values like primitives.
            It's not generally desirable to track mutations on the internal representation of a promise.
        </p>
    </>
);