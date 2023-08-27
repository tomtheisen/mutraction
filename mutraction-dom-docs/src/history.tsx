import { defaultTracker, track } from "mutraction-dom";
import { codeSample } from "./codesample.js";

function ex1() {
    const model = track({ current: 0 });

    const app = (
        <>
            <p>The current value is { model.current }</p>
            <button onclick={ () => model.current += 1 }>+1</button>
            <button onclick={ () => model.current += 10 }>+10</button>
            <button onclick={ () => defaultTracker.undo() }>Undo</button>
        </>
    );

    return app;
}

export function history() {
    return (
        <>
            <h1>Working with the mutation history</h1>
            <p>
                Mutraction remembers every mutation that's been applied to all tracked models.
                These changes aren't stored as snapshots, but as the minimum difference from each state to the next.
                More depth is provided in the <a href="#ref/Tracker"><code>Tracker</code> documentation</a>.
            </p>
            <p>
                Here's a quick demo to give you an idea.
            </p>
            { codeSample(`
                import { defaultTracker, track } from "mutraction-dom";

                const model = track({ current: 0 });

                const app = (
                  <>
                    <p>The current value is { model.current }</p>
                    <button onclick={ () => model.current += 1 }>+1</button>
                    <button onclick={ () => model.current += 10 }>+10</button>
                    <button onclick={ () => defaultTracker.undo() }>Undo</button>
                  </>
                );
                `, ex1(), { sandboxLink: true, docAppend: "app" }
            ) }

            <h2>Transactions</h2>
            <p>
                It's possible to include several model mutations in a single atomic operation.
                History manipulation will treat these as single operations.
                This can be controlled using the <a href="#ref/Tracker"><code>Tracker</code> object</a>.
            </p>
        </>
    )
}