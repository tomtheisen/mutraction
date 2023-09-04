import { track } from "mutraction-dom";
import { codeSample } from "../codesample.jsx";
import { muLogo } from "../mulogo.jsx";

export function intro() {
    const model = track({ clicks: 0 });
    const app = (
        <button onclick={() => ++model.clicks}>
            {model.clicks} clicks
        </button>
    );

    return <div>
        <div style={{ 
            textAlign: "center", 
            background: "radial-gradient(circle closest-side at center, #ccf3 50%, rgba(0, 0, 0, 0) 100%)",
            padding: "2em" 
        }}>{ muLogo(300) }</div>
        <hgroup style={{ marginTop: "-3em" }}>
            <h1>Mutraction</h1>
            <h2>Reactive UI in Typescript and JSX</h2>
        </hgroup>
        <p>
            Mutraction automatically updates DOM elements when needed.
            It tracks changes made using normal property assignment and mutations.
            The entry point is the <code>track()</code> function.
            After that, you can reference the tracked object in JSX expressions.
            JSX expressions produce real DOM elements that you can insert directly into the document.
        </p>
        { codeSample(`
            const model = track({ clicks: 0 });
            const app = (
              <button onclick={ () => ++model.clicks }>
                { model.clicks } clicks
              </button>
            );

            document.body.append(app);
            `, app, { sandboxLink: true, sandboxImports: ["track"] }
        ) }
        <p>
            Mutraction supports typescript and modern browsers.
        </p>
    </div>;
}
