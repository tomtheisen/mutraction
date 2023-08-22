import { ForEach, track } from "mutraction-dom"
import { codeSample } from "./codesample.js";

function ex1() {
    const model = track({ 
        flavors: ["vanilla", "chocolate", "strawberry"],
        selected: ""
     });

     const app = (
        <>
            <p>Currently selected: <strong>{ model.selected }</strong></p>
            <hr />
            { ForEach(
                model.flavors, 
                f => <label>
                        <input type="radio" 
                            checked={ f == model.selected } 
                            onclick={ () => model.selected = f } />
                        { f }
                    </label>
            ) }
            <hr />
            <select value={ model.selected } mu:syncEvent="change">
                <option />
                { ForEach(
                    model.flavors,
                    f => <option value={ f }>{ f }</option>
                ) }
            </select>
        </>
     );

     return app;
}

export function radio() {
    return (
        <>
            <h1>Radio buttons</h1>
            <p>
                It's a common pattern to have several radio buttons representing a single model value.
                Whichever one is checked should set the value of the model property.
                This can be accomplished using <code>checked</code> and <code>onclick</code>.
                The <code>onclick</code> handler fires even when a button is selected using
                other input devices like keyboard or touch.
            </p>

            <h2>Selects</h2>
            <p>
                Drop-down select elements are used for a similar purpose.
                These can be bound by applying <code>value</code> and <code>mu:syncEvent</code> to
                the <code>&lt;option&gt;</code> elements.
            </p>

            <p>
                Both of these patterns create two-way bindings.
            </p>

            { codeSample(`
                const model = track({ 
                    flavors: ["vanilla", "chocolate", "strawberry"],
                    selected: "chocolate"
                });

                const app = (
                    <>
                        <p>Currently selected: <strong>{ model.selected }</strong></p>
                        <hr />
                        { ForEach(
                            model.flavors, 
                            f => <label>
                                    <input type="radio" 
                                        checked={ f == model.selected } 
                                        onclick={ () => model.selected = f } />
                                    { f }
                                </label>
                        ) }
                        <hr />
                        <select value={ model.selected } mu:syncEvent="change" >
                            { ForEach(
                                model.flavors,
                                f => <option value={ f }>{ f }</option>
                            ) }
                        </select>
                    </>
                );
                `, ex1()
            ) }
        </>
    )
}