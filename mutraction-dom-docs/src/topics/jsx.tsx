import { track } from "mutraction-dom";
import { codeSample } from "../codesample.js";

function ex1() {
    const model = track({ current: "" })
    const input = <input /> as HTMLInputElement;
    input.addEventListener("input", () => model.current = input.value );
    const app = (
        <>
            {/* This is a comment */}
            { input }
            <p>The current value: { model.current }</p>
        </>
    );

    return app;
}

function ex2() {
    const model = track({ current: "initial" });
    const app = (
        <>
            Literal: <input value="model.current" /><br />
            Expression: <input value={ model.current } mu:syncEvent="input" /><br />
            Spread: <input {...{ value: model.current }} mu:syncEvent="input" /><br />
            <p>The current value: { model.current }</p>
        </>
    );

    return app;
}

function ex3() {
    const hr = <hr />;
    const app = (
        <>
            <p>1 + 2 is { 1 + 2 }.</p>
            { hr }
            <p>An array is { [1, 2, [3, 4]] }</p>
        </>
    );

    return app;
}

function ex4() {
    const model = track({ items: [{ name: "bongo" }] });
    function FC(item: typeof model.items[number]) {
        return <>Name: { item.name }</>;
    }

    const app = (
        <div>
            <p>This is part of the outer component.</p>
            { FC(model.items[0]) }
        </div>
    );

    return app;
}

export function jsx() {
    return <>
        <h1>Mutraction JSX</h1>
        <p>
            Mutraction uses <a href="https://facebook.github.io/jsx/">JSX</a> heavily.  
            It also provides typescript typings for the JSX elements.
            JSX can be used for named elements, or for fragments using this <code>&lt;&gt;syntax&lt;/&gt;</code>,
            which produces a <a href="https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment"><code>DocumentFragment</code></a>.
            There are a small handful of mutraction specific attributes, but all JSX expressions yield real DOM elements or fragments.
            This means you can easily get references for extra manipulation if you need to.
        </p>

        { codeSample(`
            const model = track({ current: "" })
            const input = <input /> as HTMLInputElement;
            input.addEventListener("input", () => model.current = input.value );
            const app = (
              <>
                {/* This is a comment */}
                { input }
                <p>The current value: { model.current }</p>
              </>
            );
            `, ex1(), { sandboxLink: true, sandboxImports: ["track"], docAppend: "app" }
        ) }

        <h2>Properties</h2>
        <p>
            There are four syntaxes for applying properties for JSX elements.
            They are applied to the element, rather than the HTML tag.
            This means that the typed DOM api is used, rather than than HTML attributes which are always strings.
            For isntance, the <code>maxlen</code> property of an <code>input</code> is a number, not a string.
        </p>

        <ul>
            <li>
                String literal - e.g. <code>&lt;a href="/foo" &gt;</code>
                <p>These are static, and don't change automatically.</p>
            </li>
            <li>
                Value expression - e.g. <code>&lt;input disabled=&#x7B; model.disabled &#x7D; &gt;</code>
                <p>
                    If these include a <a href="#topics/tracking">tracked model property</a>, the
                    element property will be automatically updated as necessary.
                    Note that the tracking works even through function calls and intermediate property getters.
                </p>
            </li>
            <li>
                Spread expression - e.g. <code>&lt;div &#x7B; ...obj &#x7D; &gt;</code>
                <p>
                    These work as expected.  However, they don't cause automatic element updates.
                    This behavior may be useful for cases where you want to set an initial default value.
                </p>
            </li>
            <li>
                Implicit true - e.g. <code>&lt;details open /&gt;</code>
                <p>
                    This one can only be used on boolean properties.  When no value is specified,
                    this implicitly assigns the value of <code>true</code>.  If you want <code>false</code> instead,
                    use <code>=&#x7B; false &#x7D;</code>
                </p>
            </li>
        </ul>

        { codeSample(`
            const model = track({ current: "initial" });
            const app = (
              <>
                Literal:    <input value="model.current" /> <br />
                Expression: <input value={ model.current } mu:syncEvent="input" /> <br />
                Spread:     <input {...{ value: model.current }} mu:syncEvent="input" /> <br />
                <p>The current value: { model.current }</p>
              </>
            );
            `, ex2(), { sandboxLink: true, sandboxImports: ["track"], docAppend: "app" }
        ) }

        <h2>Children</h2>
        <p>
            JSX element children can be text or expressions.  Text is retained verbatim.  
            Expressions are delimited with curly braces.
            Primitives, DOM elements, arrays, and more can all be used here.
            If you have an array, it might be more useful to 
            use <a href="#ref/ForEach"><code>ForEach()</code></a>.
        </p>
        { codeSample(`
            const hr = <hr />;
            const app = (
              <>
                <p>1 + 2 is { 1 + 2 }.</p>
                { hr }
                <p>An array is { [1, 2, [3, 4]] }</p>
              </>
            );        
            `, ex3(), { sandboxLink: true, docAppend: "app" }
        ) }

        <h2>Function components</h2>
        <p>
            There are none!  At least, there's no special syntax for these in JSX.
            Since JSX elements evaluate to DOM elements, and JSX expression children can be DOM elements, there's no need for a special case.
            Just call your function as a value inside curly braces.
        </p>
        <p>
            Note that children elements aren't replaced automatically.  They keep their identities.
            If you need to do this, it's possible to achieve with an <a href="#ref/effect"><code>effect</code></a>,
            however, there's a good chance you don't actually need to do this.
        </p>
        <p>
            However, <em>non-</em>element children, such as strings and numbers, <em>are</em> replaced automatically
            when one of their dependencies change.
        </p>
        { codeSample(`
            const model = track({ items: [{ name: "bongo" }] });
            
            function FC(item: typeof model.items[number]) {
              return <>Name: { item.name }</>;
            }

            const app = (
              <div>
                <p>This is part of the outer component.</p>
                { FC(model.items[0]) }
              </div>
            );        
            `, ex4(), { sandboxLink: true, sandboxImports: ["track"], docAppend: "app" }
        ) }
    </>;
}