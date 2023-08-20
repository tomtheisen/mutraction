import { codeSample } from "./codesample.js";

export function getStarted() {
    return (
        <>
            <h1>Getting Started</h1>
            <p>
                To get started, you'll need a current <a href="https://nodejs.org/">NPM</a> installed.
                Then run these in an empty directory.
            </p>
            { codeSample(`
                npx degit github:tomtheisen/mutraction/mutraction-dom-template
                npm install
                npm run build
                `
            ) }
            <p>
                Then open up <code>index.html</code> right from the file system.
                No fancy servers or whatever.
            </p>
        </>
    );
}
