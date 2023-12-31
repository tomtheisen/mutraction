import { track } from "mutraction-dom";
import { codeSample } from "../codesample.js";

function ex1() {
    const model = track({ checked: true });

    const app = (
        <>
            <label>
                <input type="checkbox" checked={ model.checked } mu:syncEvent="change" />
                Show paragraph
            </label>
            <p mu:if={ model.checked }>
                Lorem ipsum dolor sit amet.
            </p>
        </>
    );

    return app;
}

function ex2() {
    const model = track({ primary: false, secondary: false });

    const app = (
        <>
            <label>
                <input type="checkbox" checked={ model.primary } mu:syncEvent="change" />
                Primary
            </label> <br />
            <label>
                <input type="checkbox" checked={ model.secondary } mu:syncEvent="change" />
                Secondary
            </label>
            <p mu:if={ model.primary }>Primary</p>
            <p mu:else mu:if={ model.secondary }>Secondary</p>
            <p mu:else>Neither</p>
        </>
    );

    return app;
}

export function ifelse() {
    return (
        <>
            <h1><code>mu:if</code></h1>
            <p>
                <code>mu:if</code> is a boolean <a href="#topics/jsx">property</a> that can be applied to
                a <a href="#topics/jsx">JSX</a> element.
                The element will be showed if the condition is true.
                If the expression includes tracked properties, the element's
                visibility will be updated when the value changes.
            </p>
            <p>
                When the element is not visible, due to a <code>false</code> condition,
                it is not present in the document.  The document properties are not affected
                by <code>mu:if</code>.
            </p>
            { codeSample(`
                const model = track({ checked: true });

                const app = (
                  <>
                    <label>
                      <input type="checkbox" checked={ model.checked } mu:syncEvent="change" />
                      Show paragraph
                    </label>
                    <p mu:if={ model.checked }>
                      Lorem ipsum dolor sit amet.
                    </p>
                  </>
                );
                `, ex1(), { sandboxLink: true, sandboxImports: ["track"], docAppend: "app" }
            ) }

            <h2><code>mu:else</code></h2>
            <p>
                You can apply a <code>mu:else</code> attribute to an element 
                immediately following an element with <code>mu:if</code>.
                <code>mu:else</code> does not take a value.
                You can apply both to a single element.
            </p>
            { codeSample(`
                const model = track({ primary: false, secondary: false });

                const app = (
                  <>
                    <label>
                      <input type="checkbox" checked={ model.primary } mu:syncEvent="change" />
                      Primary
                    </label> <br />
                    <label>
                      <input type="checkbox" checked={ model.secondary } mu:syncEvent="change" />
                      Secondary
                    </label>
                    <p mu:if={ model.primary }>Primary</p>
                    <p mu:else mu:if={ model.secondary }>Secondary</p>
                    <p mu:else>Neither</p>
                  </>
                );
                `, ex2(), { sandboxLink: true, sandboxImports: ["track"], docAppend: "app" }
            ) }

            <h2>Consequence of lazy initialization</h2>
            <p>
                Because <code>mu:if</code> is a mechanism for <a href="#recipes/lazy">lazy evaluation</a>,
                there can be some unexpected behavior.  Normally, the result of a <a href="#topics/jsx">JSX</a> expression
                is the corresponding DOM element.  However, in the case where the condition for <code>mu:if</code> is false,
                the result of the expression will be an empty <code>Text</code> node.  When inserted into the document,
                it will be replaced by the appropriate element when the condition becomes true.
            </p>

            { codeSample(`
                const div1 = <div mu:if={ true } />;
                console.log(div1.constructor.name); // HTMLDivElement
                
                const div2 = <div mu:if={ false } />;
                console.log(div2.constructor.name); // Text    
                `) }
        </>
    );
}