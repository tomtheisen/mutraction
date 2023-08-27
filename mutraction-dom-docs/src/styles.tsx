import { track } from "mutraction-dom";
import { codeSample } from "./codesample.js";

function ex1() {
    const model = track({ checked: false });

    function getClass() {
        return model.checked ? "weighty" : "normal"
    }

    const app = (
        <>
            <style>{" .weighty { font-weight: bold; } "}</style>
            <label>
                <input type="checkbox" checked={ model.checked } mu:syncEvent="change" />
                Enable weightiness
            </label>
            <p className={ getClass() }>Lorem ipsum dolor sit amet.</p>
        </>
    );

    return app;
}

function ex2() {
    const model = track({ weighty: false, important: false });

    const app = (
        <>
            <style>{`
                .important { color: red; }
                .weighty { font-weight: bold; }
            `}</style>
            <label>
                <input type="checkbox" checked={ model.weighty } mu:syncEvent="change" />
                Enable weightiness
            </label> <br/>
            <label>
                <input type="checkbox" checked={ model.important } mu:syncEvent="change" />
                Enable importance
            </label>
            <p classList={{ weighty: model.weighty, important: model.important }}>
                Lorem ipsum dolor sit amet.
            </p>
        </>
    );
    
    return app;
}

function ex3() {
    const model = track({ color: "blue" });

    const app = (
        <>
            <button onclick={ () => model.color = "red" }>Red</button>
            <button onclick={ () => model.color = "green" }>Green</button>
            <p style={{ color: model.color }}>
                Lorem ipsum dolor sit amet.
            </p>
        </>
    );

    return app;
}

export function styles() {
    return (
        <>
            <h1>Inline styles and CSS classes</h1>

            <p>
                There are three main ways for applying dynamic styles to document elements.
            </p>

            <h2>Property <code>className</code></h2>
            <p>
                This is a string property that assigns a CSS class.  Multiple classes are separated by spaces.  Pretty vanilla.
                Classes can be defined in a stylesheet elsewhere.  If you're feeling bold, you can put <code>&lt;style&gt;</code> tags
                into your <a href="#topics/jsx">JSX</a>, but they're not scoped to the containing element.
            </p>
            { codeSample(`
                const model = track({ checked: false });

                function getClass() {
                  return model.checked ? "weighty" : "normal"
                }

                const app = (
                  <>
                    <style>{" .weighty { font-weight: bold; } "}</style>
                    <label>
                      <input type="checkbox" checked={ model.checked } mu:syncEvent="change" />
                      Enable weightiness
                    </label>
                    <p className={ getClass() }>Lorem ipsum dolor sit amet.</p>
                  </>
                );
                `, ex1(), { sandboxLink: true, sandboxImports: ["track"], docAppend: "app" }
            ) }

            <h2>Property <code>classList</code></h2>
            <p>
                Multiple classes can be controlled separately using <code>classList</code>.
                It takes a javascript object with boolean values.  
                The property names are used for class names.
                Classes are applied when the corresponding property turns true.
            </p>
            { codeSample(`
                const model = track({ weighty: false, important: false });

                const app = (
                  <>
                    <style>{\`
                        .important { color: red; }
                        .weighty { font-weight: bold; }
                    \`}</style>
                    <label>
                      <input type="checkbox" checked={ model.weighty } mu:syncEvent="change" />
                      Enable weightiness
                    </label> <br/>
                    <label>
                      <input type="checkbox" checked={ model.important } mu:syncEvent="change" />
                      Enable importance
                    </label>
                    <p classList={{ weighty: model.weighty, important: model.important }}>
                      Lorem ipsum dolor sit amet.
                    </p>
                  </>
                );
                `, ex2(), { sandboxLink: true, sandboxImports: ["track"], docAppend: "app" }
            ) }

            <h2>Property <code>style</code></h2>
            <p>
                If classes aren't your thing, you can use inline styles via the <code>styles</code> property.
                It takes an object whose keys are CSS properties.
                They are written in camelCase rather than kebab-case.
            </p>
            { codeSample(`
                const model = track({ color: "blue" });

                const app = (
                  <>
                    <button onclick={ () => model.color = "red" }>Red</button>
                    <button onclick={ () => model.color = "green" }>Green</button>
                    <p style={{ color: model.color }}>
                      Lorem ipsum dolor sit amet.
                    </p>
                  </>
                );
                `, ex3(), { sandboxLink: true, sandboxImports: ["track"], docAppend: "app" }
            ) }
        </>
    )
}