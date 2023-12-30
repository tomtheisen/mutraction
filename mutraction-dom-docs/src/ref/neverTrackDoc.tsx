import { neverTrack, track } from "mutraction-dom";
import { codeSample } from "../codesample.js";

function ex1() {
    const model = track({
        clicks: 0,
        data: neverTrack({ first: "Bill", last: "Smith", accolades: 0 }),
    });

    const app = <>
        <p>
            Clicks: { model.clicks } 
            <button onclick={ () => ++model.clicks }>Increment</button>
        </p>
        <p>
            { model.data.first } { model.data.last } 
            accolades: { model.data.accolades } (won't be updated)
            <button onclick={ () => ++model.data.accolades }>Regard</button>
        </p>
    </>;
    
    return app;
}

export function neverTrackDoc() {
    return (
        <>
            <h1><code>neverTrack()</code></h1>
            <p>
                Normally, any object referenced as a property of a <a href="#ref/track">tracked</a> object also becomes tracked.
                This is usually what you want, as you want your whole state model to watch for changes to reactively update any dependencies.
                Sometimes though, you might want to track a reference <em>to</em> an object without tracking the properties <em>in</em> the object.
                That's where <code>neverTrack()</code> comes in.
            </p>
            <p>
                When you pass an object to <code>neverTrack()</code>, it will never be proxied or tracked.
                <code>neverTrack</code> is useful in certain advanced mutracting scenarios, but is 
            </p>

            <h2>Arguments</h2>
            <ul>
                <li>
                    <code>obj</code>
                    <p>
                        This must be an <code>object</code>.  Other types of values aren't ever able to be tracked.
                        This object instance will never be <a href="#ref/track">tracked</a>.
                    </p>
                </li>
            </ul>

            <h2>Return value</h2>
            <p>
                This function returns its argument, unaltered.
            </p>

            { codeSample(`
                const model = track({
                    clicks: 0,
                    data: neverTrack({ first: "Bill", last: "Smith", accolades: 0 }),
                });

                const app = <>
                    <p>
                        Clicks: { model.clicks } 
                        <button onclick={ () => ++model.clicks }>Increment</button>
                    </p>
                    <p>
                        { model.data.first } { model.data.last } 
                        accolades: { model.data.accolades } (won't be updated)
                        <button onclick={ () => ++model.data.accolades }>Regard</button>
                    </p>
                </>;
                `, ex1(), { sandboxLink: true, docAppend: "app", sandboxImports: ["track", "neverTrack"] }) }
        </>
    );
}