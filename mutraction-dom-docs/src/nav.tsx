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
                        <li><a href="#">Dependencies</a></li>
                        <li><a href="#">Property references</a></li>
                        <li><a href="#">Two-way binding</a></li>
                        <li><a href="#">Change history</a></li>
                        <li><a href="#">Transactions</a></li>
                        <li><a href="#">JSX</a></li>
                        <li><a href="#">Components</a></li>
                        <li><a href="#">Inline styles</a></li>
                        <li><a href="#">CSS classes</a></li>
                    </ul>
                </details>
            </li>
            <li>
                <details open={true}>
                    <summary><a>Reference</a></summary>
                    <ul>
                        <li><a href="#">mu:if / mu:else</a></li>
                        <li><a href="#">mu:syncEvent</a></li>
                        <li><a href="#">ForEach</a></li>
                        <li><a href="#">ForEachPersist</a></li>
                        <li><a href="#">track</a></li>
                        <li><a href="#">effect</a></li>
                        <li><a href="#">Router</a></li>
                        <li><a href="#">Property references</a></li>
                        <li><a href="#">Tracker</a></li>
                    </ul>
                </details>
            </li>
            <li><a href="#">Why mutraction</a></li>
            <li><a href="#">Troubleshooting</a></li>
        </ul>
    </nav>;
