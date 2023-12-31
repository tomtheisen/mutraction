import { track, effect, defaultTracker } from "mutraction-dom";
import { codeSample } from "../codesample.js";

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

function ex2() {
    const model = track({ a: 1, b: 2 });

    const output = <output style={{ display: "block" }} /> as HTMLElement;
    
    effect(() => {
        // message is an untracked snapshot
        const message = `a:${ model.a } b:${ model.b }`;
        output.append(<p>{ message }</p>);
    });
    
    // effect runs for each mutation
    model.a = 3;
    model.b = 4;
    
    // effects don't run during a transaction
    defaultTracker.startTransaction();
    model.a = 5;
    model.b = 6;
    // but wait until commit
    defaultTracker.commit();

    return output;
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

            <h2>Composite mutations</h2>
            <p>
                If you have several properties you want to change, you might want to avoid notifying dependencies
                until all the changes are complete.  In that case, you can put the changes in a transaction.
                Subscribers won't be notified until all the open transactions are committed.  By default, tracked functions
                implicitly create and commit transactions.
            </p>
            { codeSample(`
                const model = track({ a: 1, b: 2 });

                const output = <output style={{ display: "block" }} /> as HTMLElement;
                
                effect(() => {
                    // message is an untracked snapshot
                    const message = \`a:\${ model.a } b:\${ model.b }\`;
                    output.append(<p>{ message }</p>);
                });
                
                // effect runs for each mutation
                model.a = 3;
                model.b = 4;
                
                // effects don't run during a transaction
                defaultTracker.startTransaction();
                model.a = 5;
                model.b = 6;
                // but wait until commit
                defaultTracker.commit();
                `, ex2(), { sandboxLink: true, docAppend: "output", sandboxImports: ["defaultTracker", "effect", "track"] }
            ) }

            <h2>Async effects</h2>
            <p>
                If the effect callback is <code>async</code>, some of the dependencies may not be recorded.
                Only those dependencies that are read prior to the first <code>await</code> will be recorded.
                If you want to ensure all the dependencies are honored, reference their values prior to <code>await</code>ing.
            </p>
            { codeSample(`
                // Bad 📛
                effect(() => {
                    console.log(model.a);
                    await doAsyncStuff();
                    // Changes to model.b may not re-trigger the effect
                    console.log(model.b);
                });

                // Good ✅
                effect(() => {
                    // The effect callback will trigger as expected
                    const a = model.a, b = model.b;
                    console.log(a);
                    await doAsyncStuff();
                    console.log(b);
                });
                `) }
        </>
    );
}