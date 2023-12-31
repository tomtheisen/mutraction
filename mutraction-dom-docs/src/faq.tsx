import { track } from "mutraction-dom";

export function faq() {
    return(
        <>
            <h1>FAQ</h1>
            <h2>How do you do server-side rendering?</h2>
            <p>
                Use something else.  I guess you could always embed some JSON in the document and then parse it.
                But mutraction doesn't make any attempt to support actual SSR.
            </p>

            <h2>How big is mutraction?</h2>
            <p>
                Small.  If this 3rd-party link is working, <a href="https://unpkg.com/mutraction-dom/dist/index.js">here's
                the whole thing</a>, unminified.  As of this writing, 
                the <a href="https://unpkg.com/mutraction-dom/dist/index.min.js">minified version</a> is 
                about 6.5kb after transport compression.
            </p>

            <h2>How fast is mutraction?</h2>
            <p>
                Fast.  This site is all <code>mutraction-dom</code>.  Click around.  Really get a sense for it.
            </p>

            <h2>Won't the undo feature cause a memory leak?</h2>
            <p>
                Technically it does leak memory.  But not much.  But don't take my word for it.
                I encourage you to check out the javascript heap size in your favorite profiling tools.
                You can turn off history tracking altogether also if you don't need transactions or undo.
                Just have <code>{`defaultTracker.setOptions({ trackHistory: false });`}</code> at the beginning of
                your application.
            </p>

            <h2>There are so many front-end frameworks.  Why another one?</h2>
            <p>
                I was so sure that someone must have already written one that worked like how I want.
                It still might be true, but I can't find it. Honorable mention 
                to <a href="https://alpinejs.dev/">Alpine</a>, <a href="https://crank.js.org/">Crank</a>,
                and <a href="https://monkberry.js.org/">Monkberry</a>.
                If any of the other bazillion frameworks suit your needs, I'm not going to try to convince you 
                otherwise. <em>But</em> maybe this is exactly what you've been looking for.
            </p>
        </>
    );
}