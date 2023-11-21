import { codeSample } from "../codesample.js"

export function debug() {
    return (
        <>
            <h1>Debugging and Troubleshooting</h1>
            <p>
                Mutraction comes with a basic diagnostic debugging tool.  
                It can be started from the javascript console.  You could even try it right now.
            </p>

            { codeSample("window[Symbol.for('mutraction.debug')]()", undefined, { caption: "Console", highlight: false }) }

            <p>
                This provides a few simple features.
            </p>

            <ul>
                <li>A count of active <a href="#ref/effect">effects</a> is listed.  This includes implicit effects used by mutraction internally.</li>
                <li>Undo and redo buttons provide <a href="#topics/history">control over the mutation history</a>.</li>
                <li>An element inspector lets you inspect which <a href="#topics/tracking">tracked properties</a> are dependencies of a selected document element.  Click the magnifying glass, then click an element that has a data dependency.</li>
                <li>Finally, there is a list of all property references.  Each is an object property contained in a tracked object.  Each one lists a count of how many dependencies it has.</li>
            </ul>
        </>
    )
}