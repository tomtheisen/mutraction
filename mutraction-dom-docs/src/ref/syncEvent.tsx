import { track } from "mutraction-dom";
import { codeSample } from "../codesample.js";

function ex1() {
    const model = track({ scrollPos: 0 });
    const containerStyle = { 
        height: "100px", 
        width: "300px", 
        overflow: "auto", 
        border: "solid orange 2px",
    };

    const app = (
        <>
            <p>The scroll position is { model.scrollPos }</p>
            <div scrollTop={ model.scrollPos } mu:syncEvent="scroll" style={ containerStyle }>
                <div>{ String(Array(150).fill("Scroll me!")) }</div>
            </div>
        </>
    );

    return app;
}

export function syncEvent() {
    return (
        <>
            <h1><code>mu:syncEvent</code></h1>
            <p>
                This is a string <a href="#topics/jsx">JSX</a> property that causes a response to the specified event.
                You can set the value to the name of a standard event for the attached element.
                This property can be used to achieve <a href="#topics/two-way">two-way data binding</a>.
                Whenever the event fires, any element properties that are set to tracked properties will be synchronized.
                This means that the current value from the element will assigned to the corresponding model property.
            </p>
            { codeSample(`
                const model = track({ scrollPos: 0 });
                const containerStyle = { 
                  height: "100px", 
                  width: "300px", 
                  overflow: "auto", 
                  border: "solid orange 2px",
                };

                const app = (
                  <>
                    <p>The scroll position is { model.scrollPos }</p>
                    <div scrollTop={ model.scrollPos } mu:syncEvent="scroll" style={ containerStyle }>
                      <div>{ String(Array(150).fill("Scroll me!")) }</div>
                    </div>
                  </>
                );
                `, ex1(), { sandboxLink: true, sandboxImports: ["track"], docAppend: "app" }
            ) }

        </>
    )
}