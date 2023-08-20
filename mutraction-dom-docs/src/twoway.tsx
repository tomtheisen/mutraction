import { track } from "mutraction-dom";
import { codeSample } from "./codesample.js";

function scroll() {
    const model = track({ text: "initial", scrollPos: 0 });
    return (
        <>
            <div>
                <input mu:syncEvent="input" maxLength={10} value={model.text} />
                <input mu:syncEvent="input" maxLength={10} value={model.text} />
                <input maxLength={10} value={model.text} />
                <input maxLength={10} {...{value: model.text}} />
            </div>
            <div>Scroll pos: {model.scrollPos}</div>
            <div mu:syncEvent="scroll" scrollTop={model.scrollPos} style={{ overflow: "scroll", maxHeight: "100px" }}>
                <div style={{ height: "200px" }}></div>
            </div>
        </>
    );
}

function ex1() {
    const model = track({ text: "initial" });
    function update() {
        model.text = String(new Date);
    }
    const app = (
        <>
            <p>The value is: { model.text } </p>
            <button onclick={ update }>Change</button>
        </>
    );

    return app;
}

function ex2() {
    const model = track({ text: "initial" });
    const app = (
        <>
            <input value={ model.text } oninput={ 
                ev => { model.text = (ev.target as any).value } 
            } />
            <p>The value is: { model.text } </p>
        </>
    );

    return app;
}

function ex3() {
    const model = track({ text: "initial" });
    const app = (
        <>
            <input value={ model.text } mu:syncEvent="input" />
            <input value={ model.text } mu:syncEvent="input" />
            <p>The value is: { model.text } </p>
        </>
    );

    return app;
}

export function twoWay() {
    return (
        <>
            <h1>Two-way binding</h1>
            <p>
                By default JSX DOM elements automatically subscribe to changes in attribute values.
            </p>
            { codeSample(`
                const model = track({ text: "initial" });
                function update() {
                    model.text = String(new Date);
                }
                const app = (
                    <>
                        <p>The value is: { model.text } </p>
                        <button onclick={ update }>Change</button>
                    </>
                );            
                `, ex1()
            ) }

            <h2>Event-based</h2>
            <p>
                Sometimes, particularly when dealing with forms, you also want JSX DOM elements to <em>set</em> values as well.
                One way to accomplish this is using events.  Note the <code>oninput</code> attribute on the <code>&lt;input&gt;</code>.
            </p>
            { codeSample(`
                const model = track({ text: "initial" });
                const app = (
                    <>
                        <input value={ model.text } oninput={ 
                            ev => { model.text = (ev.target as any).value } 
                        } />
                        <p>The value is: { model.text } </p>
                    </>
                );            
                `, ex2()
            ) }
            <p>
                This approach is perfectly fine, but it's a bit inconvenient.
            </p>

            <h2>A better way?</h2>
            <p>
                <a href="#ref/mu:syncEvent"><code>mu:syncEvent</code></a> provides an alternate approach.
                If you apply this attribute to a jsx element, then the property bindings become <em>two-way</em>.
                This means that, in addition to subscribing to the value as normal, it can also publish changes to the property.
            </p>
            { codeSample(`
                const model = track({ text: "initial" });
                const app = (
                    <>
                        <input value={ model.text } mu:syncEvent="input" />
                        <input value={ model.text } mu:syncEvent="input" />
                        <p>The value is: { model.text } </p>
                    </>
                );            
                `, ex3()
            ) }
            <p>
                More information about <code>mu:syncEvent</code> is available in the <a href="#ref/mu:syncEvent">reference documentation</a>.
            </p>
        </>
    );
}
