import { codeSample } from "./codesample.js";

export function mounting() {
    return (
        <>
            <h1>"Mounting" "components"</h1>
            <p>
                This isn't really a thing in mutraction.  Everything is DOM elements.
                To put them into the document, you can use DOM 
                methods. <code>append()</code> and <code>replaceWith()</code> work pretty well for this purpose.
            </p>

            { codeSample(`
                const app = <div>Hello world</div>;
                // app is a HTMLDivElement
                document.body.append(app);
                `
            ) }

            <p>
                But you can still do all the same stuff.  And probably more.  
                You just have to use <code>{`{`}</code> curly braces <code>{`}`}</code> instead 
                of <code>&lt;</code> angle braces <code>&gt;</code>.  Then you can use
                regular old javascript functions in place of components.
            </p>
        </>
    );
}