import { track, Router } from "mutraction-dom";
import { codeSample } from "../codesample.js";

export function routerDoc() {
    return (
        <>
            <h1><code>Router()</code></h1>
            <p>
                This function provides a simple client-side router.
                It listens for the <a href="https://developer.mozilla.org/en-US/docs/Web/API/Window/hashchange_event"><code>hashchange</code></a> event.
                Each time a client-side navigation occurs, <code>Router()</code> checks its list of routes.
                It will provide content from the first route that matches.
            </p>

            <h2>Arguments</h2>
            <p>
                <code>Router()</code> takes a variable number of arguments.  Each one represents a route, in order of precedence.
                Each route object can have two properties.
            </p>
            <ul>
                <li>
                    <code>pattern</code> - optional
                    <p>
                        This is a string or Regexp.  If it's a string, it must match the hash portion of the url exactly,
                        like <code>"#foo"</code>.
                        If it's a Regexp, it must match a substring of the hash portion.  If you want to match the whole
                        pattern, you can use the anchor characters like <code>/^#foo$/</code>.
                    </p>
                </li>
                <li>
                    <code>element</code>
                    <p>
                        This is a document node, or a function that produces one.
                        If a function is provided, the node will be loaded lazily.
                        In the case of a Regexp pattern, the function can accept the match array.
                    </p>
                </li>
                <li>
                    <code>suppressScroll</code> - optional
                    <p>
                        If true, this prevents the default scroll behavior.
                        By default, the page will scroll to top after each route resolution.
                    </p>
                </li>
            </ul>

            <p>
                These routes have been added to the documentation app you're looking at now.
                The <code>router</code> object is a regular DOM node that you can drop into a layout.
            </p>

            <ul>
                <li><a href="#clock">Clock</a></li>
                <li><a href="#id=123">Id match</a></li>
            </ul>

            { codeSample(`
                const router = Router(
                  { pattern: '#clock', element: () => <>{ new Date }</> },
                  { pattern: /#id=(\\d+)/, element: match => <>Id match: {match[1]}</> }
                );
                `
            ) }
        </>
    )
}