import { todoApp } from "./todo/todo.js";

export function todoWrapper() {
    return(
        <>
            <h1>Todo example app</h1>
            <p>
                This shows how to use many mutraction's features together in a simple todo list.
                The <a href="https://github.com/tomtheisen/mutraction/tree/master/mutraction-dom-docs/src/examples/todo">source code</a> is
                available on github.
            </p>
            <hr />
            { todoApp }
        </>
    );
}