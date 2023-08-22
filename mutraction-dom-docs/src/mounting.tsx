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
        </>
    );
}