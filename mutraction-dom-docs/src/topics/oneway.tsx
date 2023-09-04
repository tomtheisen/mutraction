import { track } from "mutraction-dom";
import { codeSample } from "./codesample.js";

export function oneWay() {
    const model = track({ clicks: 0 });
    const app = (
        <button onclick={() => ++model.clicks}>
            {model.clicks} clicks
        </button>
    );

    return (
        <>
            <h1>One-way binding</h1>
            <p>
                Any time a <a href="#topics/jsx">JSX</a> expression contains a reference to 
                a <a href="#topics/tracking">tracked</a> property, it will automatically be kept
                up to date with any changes to that property.
            </p>

            <h2>But how <em>precisely</em> does that work?</h2>
            <p>
                Let's walk through it this example.  It is totally unnecessary to follow all this.
                It just works.  But if you want to know how, read on.
            </p>
            { codeSample(`
                const model = track({ clicks: 0 });
                const app = (
                  <button onclick={ () => ++model.clicks }>
                    { model.clicks } clicks
                  </button>
                );

                // The app assignment JSX compiles to this.
                // This happens automatically, and doesn't go in your source code.
                const app = element(
                    "button", 
                    {}, 
                    { onclick: () => () => ++model2.clicks }, 
                    child(() => model2.clicks), 
                    " clicks"
                );
                `, app
            ) }

            <ol>
                <li><code>track()</code> is called with an object argument.  It returns a new proxy targeting the object.</li>
                <li>
                    The JSX expression's compiled form is evaluated.  It is implemented in terms 
                    of <code>element()</code> and <code>child()</code>.
                    <p>
                        <code>element()</code> takes an element type, static properties, and dynamic properties.
                        The remainder of the arguments are the children of the element.
                    </p>
                </li>
                <li>
                    Dependencies are calculated.  
                    <p>
                        The dynamic properties and children are wrapped in lambdas.
                        As they are evaluated, the proxy maintains a list of dependency properties for each.
                        Each one registers a dependency with the property reference on the proxy.
                    </p>
                    <p>
                        In this case, there's one dependency dependency registered for child text node.
                    </p>
                </li>
                <li>Time passes…</li>
                <li>The user clicks the button.</li>
                <li>The click handler is invoked.</li>
                <li>The <code>clicks</code> property is incremented through the proxy.</li>
                <li>When the property is assigned to the proxy, the property reference notifies all of its subscribers.</li>
                <li>
                    In this case there is one subscriber, which is 
                    an <a href="#ref/effect"><code>effect</code></a> that updates the text node.
                </li>
                <li>The effect is invoked, updating the text node in the button.</li>
            </ol>
        </>
    );
}
