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
                            <code>trackHistory</code> - default <code>true</code>
                            <p>
                                This controls whether the tracker will track history.
                                If not, no history manipulation will be possible.
                                Dependency notification will continue to happen as normal.
                            </p>
                        </li>
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
                        <li>
                            <code>compactOnCommit</code> - default <code>true</code>
                            <p>
                                Transactions often have series of mutations that
                                "cancel out".  Imagine changing a property, and then changing it right back.
                                This option will memory-optimize the representation
                                of committed transactions by simplifying the list of mutations.
                            </p>
                        </li>
                    </ul>
                </ul>
            </ul>

            <h2>Properties</h2>
            <ul>
                <li>
                    <code>history</code>
                    <p>
                        This is an array of mutation objects representing the
                        entire history of all tracked objects.  Each entry contains
                        the minimal diff necessary to apply the change.  It does not store
                        snapshots of entire objects.
                    </p>
                </li>
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
                        that depend on it.  If you use this method, nothing will be updated or notified.
                    </p>
                </li>
                <li>
                    <code>setOptions(options)</code>
                    <p>
                        This configures the tracker.
                        The available options are the same as listed for the constructor.
                        This method cannot be called after <code>track()</code> has been invoked on this tracker.
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
                    <code>commit(transaction)</code>
                    <p>
                        This commits a transaction.  The argument is optional.
                        If provided, it must be the top unresolved transaction in the stack.
                        This will convert the top-most open transaction into an atomic operation
                        inside the enclosing transaction.
                        If there is no enclosing transaction, it will add an item to <code>history</code>.
                    </p>
                </li>
                <li>
                    <code>rollback(transaction)</code>
                    <p>
                        The counterpart to <code>commit()</code>.
                        This will undo all the mutations applied during the top open transaction.
                    </p>
                </li>
                <li>
                    <code>undo()</code>
                    <p>
                        This reverts the most recent mutation or committed transaction.
                    </p>
                </li>
                <li>
                    <code>redo()</code>
                    <p>
                        As long as nothing has changed, this will re-perform
                        the most recently undone mutation.
                        Making any mutation to any tracked property will clear
                        the redo buffer, causing this to have no effect.
                    </p>
                </li>
                <li>
                    <code>clearRedos()</code>
                    <p>
                        This empties the redo buffer.
                    </p>
                </li>
                <li>
                    <code>clearHistory()</code>
                    <p>
                        This commits all open transactions and clears all history.
                        No changes are made to any tracked model.
                    </p>
                </li>
            </ul>
        </>
    );
}
