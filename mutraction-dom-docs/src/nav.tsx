export const nav = 
    <nav>
        <ul style={{ position: "sticky", top: "1em", paddingLeft: "0" }}>
            <li><a href="?">Introduction</a></li>
            <li><a href="#start">Getting Started</a></li>
            <li>
                <details open={true}>
                    <summary><a>Topics</a></summary>
                    <ul>
                        <li><a href="#topics/tracking">Model tracking</a></li>
                        <li><a href="#topics/jsx">JSX</a></li>
                        <li><a href="#topics/events">Events</a></li>
                        <li><a href="#topics/one-way">One-way binding</a></li>
                        <li><a href="#topics/two-way">Two-way binding</a></li>
                        <li><a href="#topics/history">Mutation history</a></li>
                        <li><a href="#topics/styles">Styles and classes</a></li>
                    </ul>
                </details>
            </li>
            <li>
                <details open={true}>
                    <summary><a>Reference</a></summary>
                    <ul>
                        <li><a href="#ref/ifelse">mu:if / mu:else</a></li>
                        <li><a href="#ref/syncEvent">mu:syncEvent</a></li>
                        <li><a href="#ref/ForEach">ForEach()</a></li>
                        <li><a href="#ref/ForEachPersist">ForEachPersist()</a></li>
                        <li><a href="#ref/PromiseLoader">PromiseLoader()</a></li>
                        <li><a href="#ref/track">track()</a></li>
                        <li><a href="#ref/effect">effect()</a></li>
                        <li><a href="#ref/Router">Router()</a></li>
                        <li><a href="#ref/Tracker">Tracker</a></li>
                    </ul>
                </details>
            </li>
            <li>
                <details open={true}>
                    <summary><a>Recipes</a></summary>
                    <ul>
                        <li><a href="#recipes/mounting">Mounting components</a></li>
                        <li><a href="#recipes/radio">Radios / selects</a></li>
                        <li><a href="#recipes/spinner">Loading spinner</a></li>
                        <li><a href="#recipes/lazy">Lazy loading</a></li>
                        <li><a href="#recipes/array">Arrays</a></li>
                        <li><a href="#recipes/html">Raw HTML</a></li>
                    </ul>
                </details>
            </li>
            <li>
                <details open={true}>
                    <summary><a>Example apps</a></summary>
                    <ul>
                        <li><a href="#example/todo">Todo list</a></li>
                    </ul>
                </details>
            </li>
            <li><a href="#why">Why mutraction</a></li>
            <li><a href="#faq">FAQ</a></li>
        </ul>
    </nav>
