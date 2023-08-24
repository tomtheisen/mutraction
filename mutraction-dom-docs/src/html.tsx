import { track } from "mutraction-dom";
import { codeSample } from "./codesample.js";

function ex1() {
    const model = track({ html: `This is <strong>dangerous</strong> markup.` });

    const app = (
        <>
            <textarea wrap="wrap" cols={30} rows={5} value={ model.html } mu:syncEvent="input" />
            <div innerHTML={ model.html }></div>
        </>
    );

    return app;
}

export function html() {
    return (
        <>
            <h1>Working with HTML strings</h1>
            <p>
                By default, angle brackets and special characters in jsx expressions are correctly
                handled as content text, rather than being able to form HTML tags.
                But what if you <em>want</em> to do that?
            </p>
            <p>
                If you do this kind of thing, you might have  
                an <a href="https://owasp.org/www-community/attacks/xss/">XSS</a> vulnerability.
                But go right ahead.  Just use the <code>innerHTML</code> property.
            </p>
            { codeSample(`
                const model = track({ html: \`This is <strong>dangerous</strong> markup.\` });

                const app = (
                    <>
                        <textarea wrap="wrap" cols={30} rows={5} value={ model.html } mu:syncEvent="input" />
                        <div innerHTML={ model.html }></div>
                    </>
                );
                `, ex1()
            ) }
        </>
    )
}