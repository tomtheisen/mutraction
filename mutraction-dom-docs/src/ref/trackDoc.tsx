export function trackDoc() {
    return (
        <>
            <h1><code>track()</code></h1>
            <p>
                The <code>track()</code> function is the main entry-point into the mutraction
                cinematic universe.  It takes an object as input, and returns the same object,
                wrapped in a tracking <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy">proxy</a>.  
                The proxy will behave identically to the original
                object, except it will notify mutraction internals when properties are accessed.
            </p>

            <h2>Arguments</h2>
            <ul>
                <li>
                    <code>model</code>
                    <p>
                        This is the model to track.  It must actually an object.
                        Other values can't be proxied.
                    </p>
                </li>
            </ul>

            <h2>Return value</h2>
            <p>
                This returns the model, wrapped in a tracking proxy.
            </p>

            <p>
                This function uses the default <a href="#ref/Tracker"><code>Tracker</code></a> instance.
                This is probably almost always what you want.  
                If you want something else, you can do it using another <a href="#ref/Tracker"><code>Tracker</code></a> instance.
            </p>
        </>
    );
}
