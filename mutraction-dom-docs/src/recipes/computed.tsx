import { track, effect } from "mutraction-dom";
import { codeSample } from "../codesample.js";

function ex1() {
    const model = track({ num1: 3, num2: 5 });

    // "computed" value based on tracked model properties
    const computedSum = () => model.num1 + model.num2;

    effect(() => console.log("The sum is", computedSum()));

    const app = (
        <>
            Number 1: <input type="number" valueAsNumber={ model.num1 } mu:syncEvent="input" />
            <br />
            Number 2: <input type="number" valueAsNumber={ model.num2 } mu:syncEvent="input" />
            <p>Sum: { computedSum() }</p>
        </>
    );

    return app;
}

export function computed() {
    return (
        <>
            <h1>Computed values</h1>
            <p>
                Some libraries and frameworks have special features for creating computed values.
                These are usually read-only values computed from other tracked or managed values.
                In mutraction, this isn't a special case.  You can just make a tracked or untracked function
                that calculates a computed value.  Use it in a context where you could use a tracked model
                like element attributes or an effect.
            </p>
            { codeSample(`
                const model = track({ num1: 3, num2: 5 });

                // "computed" value based on tracked model properties
                const computedSum = () => model.num1 + model.num2;

                effect(() => console.log("The sum is", computedSum()));

                const app = (
                    <>
                        Number 1: <input type="number" valueAsNumber={ model.num1 } mu:syncEvent="input" />
                        <br />
                        Number 2: <input type="number" valueAsNumber={ model.num2 } mu:syncEvent="input" />
                        <p>Sum: { computedSum() }</p>
                    </>
                );
                `, ex1(), { docAppend: "app", sandboxImports: ["effect", "track"], sandboxLink: true }
            ) }
        </>
    );
}