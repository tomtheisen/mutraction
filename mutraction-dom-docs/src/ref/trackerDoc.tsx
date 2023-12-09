export function trackerDoc() {
    return (
        <>
            <h1><code>Tracker</code></h1>
            <p>
                This is the class that handles all the <a href="#topics/history">history management</a> and 
                much of the mutation notification dispatch.  Normally, you don't need to interact with it
                directly.  But you can if you're into that sort of thing.
            </p>
            <p>
                There's a single default instance of the class, exported as <code>defaultTracker</code>.
                Unless otherwise specified, the default instance is used for everything.
                But it is possible to make more.
            </p>

            <h2>Constructor arguments</h2>
            <ul>
                <ul>
                    <code>options</code> - optional object
                    <ul>
                        <li>
                            <code>autoTransactionalize</code> - default <code>true</code>
                            <p>
                                This controls how tracked functions create history.
                                If this is set, when a tracked function is called,
                                it will implicitly create a transaction.
                                Mainly, that means that <code>undo()</code> will treat
                                the whole thing atomically.
                            </p>
                        </li>
                    </ul>
                </ul>
            </ul>

            <h2>Methods</h2>
            <ul>
                <li>
                    <code>track()</code>
                    <p>
                        This has the same signature and behavior as <a href="#ref/track">track()</a>, except
                        it will be using <em>this</em> tracker instead of the default one.
                    </p>
                </li>
                <li>
                    <code>trackAsReadOnlyDeep()</code>
                    <p>
                        This is functionally identical to <code>track()</code>.
                        The difference is in the Typescript type annotation.
                        The return value is a deeply read-only version of the input type.
                        This may be useful if you want to force all mutations to happen
                        in model methods, rather that direct mutations.
                    </p>
                </li>
                <li>
                    <code>ignoreUpdates(callback)</code>
                    <p>
                        This method invokes a callback without notifying any dependency trackers.
                        Normally, assigning to a tracked variable will update any effects or DOM elements
                        that depend on it.  If you use this method, no dependency subscribers will be notified.
                    </p>
                </li>
                <li>
                    <code>setOptions(options)</code>
                    <p>
                        This configures the tracker.
                        The available options are the same as listed for the constructor.
                        The primary use case for this method is to configure the default <code>Tracker</code> instance.
                    </p>
                </li>
                <li>
                    <code>startTransaction(name)</code>
                    <p>
                        This starts a transaction.  You can give it an optional name
                        which will appear in the <code>history</code> entry for the transaction.
                        Transactions can be open concurrently, but they must be resolved in
                        stack order.
                    </p>
                    <p>
                        This returns a transaction object.
                    </p>
                </li>
                <li>
                    <code>commit()</code>
                    <p>
                        This commits a transaction.
                        If provided, it must be the top unresolved transaction in the stack.
                        This will convert the top-most open transaction into an atomic operation
                        inside the enclosing transaction.
                        If there is no enclosing transaction, it will add an item to <code>history</code>.
                    </p>
                </li>
            </ul>
        </>
    );
}
