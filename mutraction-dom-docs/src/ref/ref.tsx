import { codeSample } from "../codesample.js";

function ex1() {
    // this variable will be assigned in the mu:ref callback
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

function ex2() {
    return <>
        <div>hello world 1</div>
        <div>hello world 2</div>
    </>;
}

export function ref() {
    return <>
        <h1><code>mu:ref</code></h1>
        <p>
            <code>mu:ref</code> is a <a href="#topics/jsx">JSX</a> attribute that helps you get a reference to the DOM corresponding element.
            It takes a callback function that accepts the element reference.
        </p>
        { codeSample(`
            // this variable will be assigned in the mu:ref callback
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
            The callback function is invoked synchronously as a side effect of the jsx expression.  Remember that jsx expressions
            resolve to DOM elements, so in some cases, you can just assign the expression straight to a variable rather than using a 
            <code>mu:ref</code> callback.  <code>mu:ref</code> is most likely to be useful in cases where the target element is not the
            top-level element of an expression.
        </p>
        { codeSample(`
            // these two blocks are behaviorally identical
            {
                let myDiv: HTMLDivElement;
                document.body.append(<div mu:ref={ el => myDiv = el }>hello world 1</div>);
                console.log("block 1", myDiv); // assigned
            }
            {
                let myDiv = <div>hello world 2</div>;
                document.body.append(myDiv);
                console.log("block 2", myDiv); // also assigned
            }
            `, ex2(), { sandboxLink: true, sandboxImports: [] }
        )}
    </>;
}