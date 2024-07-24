export const nav = 
    <nav>
        <ul>
            <li><a href="?">Introduction</a></li>
            <li><a href="#start">Getting Started</a></li>
            <li>
                <details open>
                    <summary><a>Topics</a></summary>
                    <ul>
                        <li><a href="#topics/tracking">Model tracking</a></li>
                        <li><a href="#topics/jsx">JSX</a></li>
                        <li><a href="#topics/events">Events</a></li>
                        <li><a href="#topics/one-way">One-way binding</a></li>
                        <li><a href="#topics/two-way">Two-way binding</a></li>
                        <li><a href="#topics/history">Mutation history</a></li>
                        <li><a href="#topics/styles">Styles and classes</a></li>
                        <li><a href="#topics/debug">Troubleshooting</a></li>
                    </ul>
                </details>
            </li>
            <li>
                <details open>
                    <summary><a>Reference</a></summary>
                    <ul>
                        <li><a href="#ref/track">track()</a></li>
                        <li><a href="#ref/effect">effect()</a></li>
                        <li><a href="#ref/Tracker">Tracker</a></li>
                        <li>
                            <details>
                                <summary><a>JSX attributes</a></summary>
                                <ul>
                                    <li><a href="#ref/ifelse">mu:if / mu:else</a></li>
                                    <li><a href="#ref/syncEvent">mu:syncEvent</a></li>
                                    <li><a href="#ref/apply">mu:apply</a></li>
                                    
                                </ul>
                            </details>
                        </li>
                        <li>
                            <details>
                                <summary><a>DOM wrappers</a></summary>
                                <ul>
                                    <li><a href="#ref/ForEach">ForEach()</a></li>
                                    <li><a href="#ref/PromiseLoader">PromiseLoader()</a></li>
                                    <li><a href="#ref/Swapper">Swapper()</a></li>
                                    <li><a href="#ref/Router">Router()</a></li>
                                </ul>
                            </details>
                        </li>
                        <li>
                            <details>
                                <summary><a>Other functions</a></summary>
                                <ul>
                                    <li><a href="#ref/makeLocalStyle">makeLocalStyle()</a></li>
                                    <li><a href="#ref/neverTrack">neverTrack()</a></li>
                                    <li><a href="#ref/untrackedClone">untrackedClone()</a></li>
                                </ul>
                            </details>
                        </li>
                    </ul>
                </details>
            </li>
            <li>
                <details open>
                    <summary><a>Recipes</a></summary>
                    <ul>
                        <li><a href="#recipes/mounting">Mounting components</a></li>
                        <li><a href="#recipes/radio">Radios / selects</a></li>
                        <li><a href="#recipes/spinner">Loading spinner</a></li>
                        <li><a href="#recipes/array">Arrays</a></li>
                        <li><a href="#recipes/html">Raw HTML</a></li>
                        <li><a href="#recipes/computed">Computed values</a></li>
                    </ul>
                </details>
            </li>
            <li><a href="#examples">Example apps</a></li>
            <li><a href="#why">Why mutraction</a></li>
            <li><a href="#faq">FAQ</a></li>
        </ul>
    </nav> as HTMLElement;

function updateActiveLink() {
    nav.querySelectorAll("a").forEach(el => {
        if (el instanceof HTMLAnchorElement) {
            el.classList.toggle("active", el.getAttribute("href") === location.hash);
        }
    });
}

updateActiveLink();
window.addEventListener("hashchange", updateActiveLink);
