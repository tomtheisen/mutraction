import { PromiseLoader } from "mutraction-dom";
import { codeSample } from "./codesample.js";

function ex1() {
    let theAnswer = new Promise<Node>(
        resolve => setTimeout(
            () => resolve(<div>The answer is 42</div>),
            3_000
        ),
    );
    
    const app = <div>{ PromiseLoader(theAnswer, <div>loading...</div>) }</div>;

    return app;
}

export function promiseLoader() {
    return (
        <>
            <h1><code>PromiseLoader()</code></h1>
            <p>
                Sometimes your data isn't ready yet.  <code>async</code> is all the rage these days.
                You can use <code>PromiseLoader()</code> to show it when it's ready.
                It takes a promise returning an element, and shows it when it's ready.
                Optionally, you can specify a loading indicator too.
            </p>

            <h2>Arguments</h2>
            <ul>
                <li>
                    <code>promise</code>
                    <p>
                        This is an async promise that yield a document node.
                        Probaby a network call, but it doesn't have to be.
                    </p>
                </li>
                <li>
                    <code>spinner</code> - optional
                    <p>
                        If provided, this document node will be shown until the promise is resolved.
                    </p>
                </li>
            </ul>

            { codeSample(`
                let theAnswer = new Promise<Node>(
                  resolve => setTimeout(
                    () => resolve(<div>The answer is 42</div>),
                    3_000
                  ),
                );
                
                const app = <div>{ PromiseLoader(theAnswer, <div>loading...</div>) }</div>;            
                `, ex1(), { sandboxLink: true, sandboxImports: ["PromiseLoader"], docAppend: "app" }
            ) }
        </>
    );
}