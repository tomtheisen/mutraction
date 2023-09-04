import { ForEach, track, ErrorBoundary } from "mutraction-dom";
import { codeSample } from "../codesample.jsx";

function ex1() {
    const model = track({
        numbers: Array(6).fill(null).map((e, i) => i)
    });
    
    function sketchy(n: number) {
        if (Math.random() < 0.3) throw "Major server malfunction";
        return <>
            <h3>Number: {n}</h3>
            <p>Here are {n} fruits: { Array(n).fill("🍉") }</p>
        </>;
    }
    
    function increment() {
        for (let i = 0; i < model.numbers.length; i++) {
            model.numbers[i]++;
        }
    }
    
    const app =
        <>
            <button onclick={ increment }>Increment</button>
            { ForEach(model.numbers, 
                n => ErrorBoundary(
                    () => sketchy(n), 
                    err => <div style={{ backgroundColor: "#c66" }}>{err}</div>)) }
        </>;
    
    return app;
}

export function errorBoundary() {
    return <>
        <h1><code>ErrorBoundary()</code></h1>
        <p>
            Normally, if anything throws while building a DOM node using a <a href="#topics/jsx">JSX</a> expression
            or function call, nothing will catch it.  This will completely cancel whatever operation was taking place,
            possibly leaving you with an empty page.
        </p>
        <p>
            To contain the damage, you can use <code>ErrorBoundary</code>.  If there's a particular function
            you think is likely to throw, wrap it.
        </p>

        <h2>Arguments</h2>
        <ul>
            <li>
                <code>nodeFactory</code>
                <p>
                    This is a parameterless function that produces the normal expected output in the form of a DOM node.
                    But it might fail and throw.
                </p>
            </li>
            <li>
                <code>showErr</code>
                <p>
                    This function takes the throw error object, and returns a DOM node indicating the failure.
                </p>
            </li>
        </ul>

        { codeSample(`
            const model = track({
                numbers: Array(6).fill(null).map((e, i) => i)
            });
            
            function sketchy(n: number) {
                if (Math.random() < 0.3) throw "Major server malfunction";
                return <>
                    <h3>Number: {n}</h3>
                    <p>Here are {n} fruits: { Array(n).fill("🍉") }</p>
                </>;
            }
            
            function increment() {
                for (let i = 0; i < model.numbers.length; i++) {
                    model.numbers[i]++;
                }
            }
            
            const app =
                <>
                    <button onclick={ increment }>Increment</button>
                    { ForEach(model.numbers, 
                        n => ErrorBoundary(
                            () => sketchy(n), 
                            err => <div style={{ backgroundColor: "#faa" }}>{err}</div>)) }
                </>;
           `, ex1(), { docAppend: "app", sandboxLink: true, sandboxImports: ["track","ForEach","ErrorBoundary"] }
        ) }
    </>;
}