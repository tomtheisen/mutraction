import { codeSample } from "./codesample.js";

export function why() {
    return (
        <>
            <h1>Why?</h1>
            <p>
                There are more than enough javascript UI frameworks and libraries around.
                Instead of doing something useful, I decided to make another one.
                Why would I do that?
            </p>

            <h2>Dependencies are automatic</h2>
            <p>
                In mutraction, you don't have to say what depends on what.
                You just write the code.  Dependencies are inferred at run time.
            </p>

            <h2>Javascript semantics are retained</h2>
            <p>
                There are no special rules of which functions you can call at which times.
                All state is kept "out in the open".  You can use pretty much any object
                graph as a tracked model.  And it will behave just as it does in normal
                javascript, because it is.
            </p>

            <h2>Document elements are native</h2>
            <p>
                There's no escape hatch to retrieve a reference to DOM elements.
                All the JSX expressions evaluate to DOM elements, so there's no
                intermediate representations.
            </p>

            <h2>Mutations are sometimes convenient</h2>
            <p>
                Just compare these two code blocks.
                I don't doubt that you can figure out what they both do.
                But at what cost?
            </p>

            { codeSample(`
                items[idx].status = "complete";
                `
            ) }

            { codeSample(`
                items = items.map((e, i) => i == idx ? { ...e, status: "complete" } : e);
                `
            ) }
            
        </>
    )
}