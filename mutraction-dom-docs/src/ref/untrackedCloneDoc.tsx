export function untrackedCloneDoc() {
    return <>
        <h1><code>untrackedClone()</code></h1>
        <p>
            This creates a deep clone of an object which is not tracked or proxied.
            The main case where this is useful is doing an intensive computation which involves
            making a lot of mutations.  The proxy layer and DOM synchronization of tracked objects
            have a cost.  In some cases, it's faster to do the computations in an untracked
            version of the object, and then put it back into a tracked model when the 
            expensive computation is complete.
        </p>

        <h2>Arguments</h2>
        <ul>
            <li>
                <code>obj</code>
                <p>
                    This is the object to clone.  It must be an object, but can't be an instance of a class or prototype.
                </p>
            </li>
            <li>
                <code>maxDepth</code> - optional
                <p>
                    This is the maximum depth of recursive traversal.  If the object graph is deeper, it will throw.
                    The default is 10.  Cyclical references aren't supported.
                </p>
            </li>
        </ul>
    </>;
}