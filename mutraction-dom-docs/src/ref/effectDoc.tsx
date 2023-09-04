import { track, effect } from "mutraction-dom";
import { codeSample } from "../codesample.jsx";

function ex1() {
    const model = track({ weather: "sunny", arrival: "on-time" });

    const output = <div /> as HTMLDivElement;
    effect(() => { 
        output.innerText = model.arrival + " and " + model.weather;
    });

    const app = (
        <>
            <input value={ model.arrival } mu:syncEvent="input" />
            <input value={ model.weather } mu:syncEvent="input" />
            { output }
        </>
    );

    return app;
}

export function effectDoc() {
    return(
        <>
            <h1><code>effect()</code></h1>
            <p>
                <code>effect()</code> takes a callback.  It invokes the callback immediately.
                It remembers which tracked model properties were read.
                Any time any of the dependent properties is changed, the callback is invoked again.
                Each time the callback is invoked, the set of dependencies is updated.
                This ensures that conditional logic and short-circuiting do not hide property dependencies.
            </p>
            <p>
                Mostly, this is used internally by mutraction, but you might find a use for it here and there.
            </p>

            <h2>Arguments</h2>
            <ul>
                <li>
                    <code>callback</code>
                    <p>
                        This is the effect callback.  When it's invoked, its dependencies
                        will be tracked.  Each time one changes, it will run again.
                        The dependency list will be re-calculated each time.
                    </p>
                    <p>
                        <code>callback</code> can optionally return a cleanup function.
                        If it does, the cleanup function will be invoked prior to invoking
                        <code>callback</code> again.
                    </p>
                </li>
                <li>
                    <code>options</code> - optional
                    <p>
                        This is an object that can contain up to two optional properties.
                    </p>
                    <ul>
                        <li>
                            <code>suppressUntrackedWarning</code> - optional
                            <p>
                                Normally, <code>effect()</code> will emit a console warning
                                if the callback contains no tracked model properties.
                                Set this property to true if you want to suppress this warning.
                            </p>
                        </li>
                        <li>
                            <code>tracker</code> - optional
                            <p>
                                Normally, the effect dependencies will be resolved using the default
                                <a href="#ref/Tracker"><code>Tracker</code></a> instance.  This is almost
                                always what you want.  But if you want to use a different one, you can set
                                it here.
                            </p>
                        </li>
                    </ul>
                </li>
            </ul>

            <h2>Return value</h2>
            <p>
                This function returns an object with a single <code>dispose()</code> method.
                Call <code>dispose()</code> if you want to stop evaluating the effect.
            </p>

            { codeSample(`
                const model = track({ weather: "sunny", arrival: "on-time" });

                const output = <div /> as HTMLDivElement;
                effect(() => { 
                  output.innerText = model.arrival + " and " + model.weather;
                });

                const app = (
                  <>
                    <input value={ model.arrival } mu:syncEvent="input" />
                    <input value={ model.weather } mu:syncEvent="input" />
                    { output }
                  </>
                );
                `, ex1(), { sandboxLink: true, sandboxImports: ["track", "effect"], docAppend: "app" }
            ) }
        </>
    );
}