export const nav = 
    <nav>
        <ul style={{ position: "sticky", top: "1em", paddingLeft: "0" }}>
            <li><a href="?">Introduction</a></li>
            <li><a href="#tryit">Try it</a></li>
            <li><a href="#start">Getting Started</a></li>
            <li>
                <details open={true}>
                    <summary><a>Topics</a></summary>
                    <ul>
                        <li><a href="#topics/tracking">Model tracking</a></li>
                        <li><a href="#topics/jsx">JSX</a></li>
                        <li><a href="#topics/events">Events</a></li>
                        <li><a href="#topics/two-way">Two-way binding</a></li>
                        <li><a href="#topics/history">Mutation history</a></li>
                        <li><a href="#topics/history">Transactions</a></li>
                        <li><a href="#topics/styles">Inline styles</a></li>
                        <li><a href="#topics/classes">CSS classes</a></li>
                        {/* <li><a href="#topics/deps">Dependencies</a></li>
                        <li><a href="#topics/proprefs">Property references</a></li> */}
                    </ul>
                </details>
            </li>
            <li>
                <details open={true}>
                    <summary><a>Reference</a></summary>
                    <ul>
                        <li><a href="#ref/ifelse">mu:if / mu:else</a></li>
                        <li><a href="#ref/syncEvent">mu:syncEvent</a></li>
                        <li><a href="#ref/ForEach">ForEach</a></li>
                        <li><a href="#ref/ForEachPersist">ForEachPersist</a></li>
                        <li><a href="#ref/track">track</a></li>
                        <li><a href="#ref/effect">effect</a></li>
                        <li><a href="#ref/Router">Router</a></li>
                        {/* <li><a href="#ref/">Property references</a></li> */}
                        <li><a href="#ref/Tracker">Tracker</a></li>
                    </ul>
                </details>
            </li>
            <li><a href="#why">Why mutraction</a></li>
            {/* <li><a href="#faq">FAQ</a></li> */}
        </ul>
    </nav>;
