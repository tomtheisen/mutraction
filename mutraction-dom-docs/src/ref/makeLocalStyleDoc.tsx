import { makeLocalStyle } from "mutraction-dom";
import { codeSample } from "../codesample.js";

function ex1() {
    const style = makeLocalStyle({
        "p": {
            backgroundColor: "yellow",
        },
        "em": {
            color: "red"
        },
    });
    
    const app =
        <>
            <p>
                This is a paragraph with an <em>emphasized</em> element.
            </p>
            <p mu:apply={ style }>
                This is a paragraph with an <em>emphasized</em> element.
            </p>
            <p>
                This is a paragraph with an <em>emphasized</em> element.
            </p>
        </>;

    return app;
}

function ex2() {
    const myStyle = makeLocalStyle({
        "*": {
            background: "yellow"
        }
    });

    function MyComp(content: string) {
        return <div mu:apply={ myStyle }>{ content }</div>;
    }

    const app = 
        <main>
            { MyComp("Hello world") }
            { MyComp("Goodbye world") }
        </main>;

    return app;
}

export function makeLocalStyleDoc() {
    return <>
        <h1><code>makeLocalStyle()</code></h1>
        <p>
            This function constructs and adopts a stylesheet.
            It can be applied to specific sub-trees so that the rules don't affect the entire document.
            To apply the stylesheet to a node, use the <a href="#ref/apply"><code>mu:apply</code></a> JSX
            attribute.
        </p>

        <h2>Arguments</h2>
        <ul>
            <li>
                <code>rules</code>
                <p>
                    This is a javascript object representing a set of CSS rule declarations.
                    The keys are css selectors like <code>ul&gt;li:first-child</code>.
                    The values are rule declarations with property names in camelCase.
                </p>
            </li>
        </ul>

        <h2>Return value</h2>
        <p>
            A token object is returned.  It can be supplied to the <a href="#ref/apply"><code>mu:apply</code></a> JSX
            attribute.  It contains identifier information for applying an attribute to the targeted DOM element.
        </p>

        { codeSample(`
            const style = makeLocalStyle({
                "p": {
                    backgroundColor: "yellow",
                },
                "em": {
                    color: "red"
                },
            });
            
            const app =
                <>
                    <p>
                        This is a paragraph with an <em>emphasized</em> element.
                    </p>
                    <p mu:apply={ style }>
                        This is a paragraph with an <em>emphasized</em> element.
                    </p>
                    <p>
                        This is a paragraph with an <em>emphasized</em> element.
                    </p>
                </>;
            `, ex1(), { docAppend: "app", sandboxLink: true, sandboxImports: ["makeLocalStyle"] }
        ) }

        <h2>Reusability</h2>
        <p>
            Local stylesheets are reusable.  If you have a UI component function that uses local style,
            you should declare it outside the function, and apply it to all the instances created.
            This avoids the overhead of repeatedly creating the same stylesheet.
        </p>
        { codeSample(`
            const myStyle = makeLocalStyle({
                "*": {
                    background: "yellow"
                }
            });

            function MyComp(content: string) {
                return <div mu:apply={ myStyle }>{ content }</div>;
            }

            const app = 
                <main>
                    { MyComp("Hello world") }
                    { MyComp("Goodbye world") }
                </main>;
            `, ex2(), { sandboxLink: true, docAppend: "app", sandboxImports: ["makeLocalStyle"] }
        ) }

        <h2>How it works</h2>
        <p>
            <code>makeLocalStyle()</code> converts all the selectors it receives so that they can
            be locally applied.  For instance <code>*</code> might 
            become <code>[data-mu-style="123-1"]:is(*), [data-mu-style="123-1"] :is(*)</code>.
            When you use <a href="#ref/apply"><code>mu:apply</code></a> for this local stylesheet,
            it will add the corresponding attriute value to the targeted element.
        </p>
    </>;
}