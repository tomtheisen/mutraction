import { codeSample } from "../codesample.js";

function ex1() {
    let dialog: HTMLDialogElement;
    const app = <div>
        <button onclick={ () => dialog.showModal() }>Show Dialog</button>
        <dialog mu:ref={ el => dialog = el }>
            This is a dialog.
            <button onclick={ () => dialog.close() }>&times;</button>
        </dialog>
    </div>;

    return app;
}

export function ref() {
    return <>
        <h1><code>mu:ref</code></h1>
        <p>
            <code>mu:ref</code> is a <a href="#topics/jsx">JSX</a> attribute that helps you get a reference to the DOM corresponding element.
            It takes a callback function that accepts the element reference.
        </p>
        { codeSample(`
            let dialog: HTMLDialogElement;
            const app = <div>
                <button onclick={ () => dialog.showModal() }>Show Dialog</button>
                <dialog mu:ref={ el => dialog = el }>
                    This is a dialog.
                    <button onclick={ () => dialog.close() }>&times;</button>
                </dialog>
            </div>;
            `, ex1(), { docAppend: "app", sandboxLink: true, sandboxImports: [] }
        )}
        <p>
            The callback function is invoked synchronously as a side effect of the jsx expression.
        </p>
        <h2>Interaction with <code>mu:if</code></h2>
        <p>
            <a href="#/ref/ifelse"><code>mu:if</code> and <code>mu:else</code></a> affect elements&rsquo; visibility in a document,
            but not the existence of those elements.  Any <code>mu:ref</code> callback will be invoked regardless of <code>mu:if</code>
            conditions or <code>mu:else</code>.
        </p>
    </>;
}