import { track } from "mutraction-dom";
import { codeSample } from "../codesample.jsx";

function ex1() {
    const model = track({ isEnabled: false });

    function expensive() {
        console.log("Expensive computations");
        return <div>Expensive results</div>;
    }

    const app = (
        <>
            <label>
                <input type="checkbox" checked={ model.isEnabled } mu:syncEvent="change" />
                Enabled
            </label> <br />
            <div mu:if={ model.isEnabled }>
                { expensive() }
            </div>
        </>
    );

    return app;
}

export function lazy() {
    return (
        <>
            <h1>Lazy initialization</h1>
            <p>
                You can defer expensive initialization.  Just use <a href="#ref/ifelse"><code>mu:if</code></a>.
                That's it.  Check the console.  The expensive computation runs at most once, but not until it's needed.
            </p>
            { codeSample(`
                const model = track({ isEnabled: false });

                function expensive() {
                  console.log("Expensive computations");
                  return <div>Expensive results</div>;
                }

                const app = (
                  <>
                    <label>
                      <input type="checkbox" checked={ model.isEnabled } mu:syncEvent="change" />
                      Enabled
                    </label> <br />
                    <div mu:if={ model.isEnabled }>
                      { expensive() }
                    </div>
                  </>
                );
                `, ex1(), { sandboxLink: true, sandboxImports: ["track"], docAppend: "app" }
            ) }
        </>
    );
}