import { codeSample } from "./codesample.js";

export function getStarted() {
    return (
        <>
            <h1>Getting started</h1>
            <p>
                To get started, you'll need a current <a href="https://nodejs.org/">NPM</a> installed.
                Then run these in an empty directory.  This will set up a hello-world style startup project template.
            </p>
            { codeSample(`
                npx degit github:tomtheisen/mutraction/mutraction-dom-template
                npm install
                npm run build
                `
            ) }
            <p>
                Then open up <code>index.html</code> right from the file system.
                You should see a basic app.
                Open up your editor and go wild building stuff.
            </p>
            <p>
                Or... if you'd rather set it up from scratch, read on.
            </p>
            <h2>Doing it the hard way</h2>
            <p>
                If you're the type of person who wants to do it yourself, I respect your point of view. 
                First, if you haven't already, create an npm project using <code>npm init</code>.
                Once you're done with that, you'll need to install some dependencies.
            </p>
            { codeSample(`
                npm i --save-dev @babel/cli @babel/core @babel/preset-env esbuild typescript
                npm i mutraction-dom
                `
            ) }
            <p>
                Then there are few config files to set up.
            </p>
            { codeSample(`
                {
                  "compilerOptions": {
                    "target": "ES2022",
                    "jsx": "preserve",
                    "jsxImportSource": "mutraction-dom",
                    "module": "ES2022",
                    "moduleResolution": "Node16",
                    "outDir": "./out/",
                    "strict": true,
                    "noImplicitAny": true,
                  },
                  "include": ["src"]
                }
                `, undefined, "tsconfig.json"
            ) }
            { codeSample(`
                {
                  "plugins": ["@babel/plugin-syntax-jsx", "mutraction-dom/compile-jsx"]
                }            
                `, undefined, ".babelrc"
            ) }
            <p>
                Next, add some build scripts to your <code>package.json</code> file.
            </p>
            { codeSample(`
                …
                "scripts": {
                  "build": "npx tsc && npm run transform && npm run bundle",
                  "transform": "npx babel out -d out2",
                  "bundle": "npx esbuild out2/index.js --bundle --format=esm --outfile=dist/index.js"
                },
                …
                `, undefined, "package.json (excerpt)"
            ) }
            <p>
                There are three steps in the <code>build</code> script.
            </p>
            <ol>
                <li>
                    Compile typescript.
                    <p>
                        This verifies and removes types, but does not transform JSX expressions.
                        You could skip this step if you write in javascript and JSX instead of typescript.
                    </p>
                </li>
                <li>
                    Transform JSX into <code>mutraction-dom</code> runtime calls using a provided babel plugin.
                    <p>
                        This converts JSX expressions into valid ECMAScript.
                        You could skip this step if you directly invoke <code>element()</code> and <code>child()</code> 
                        from <code>mutraction-dom</code>, but this is not recommended.
                    </p>
                </li>
                <li>
                    Bundles all the source files into one bundle. The input files are ECMAScript modules.
                    <p>
                        That means the entry point needs to be loaded with <code>&lt;script type="module" src="…"&gt;</code>.
                        The output file is a normal script, meaning it can be started without specifying a <code>type</code> attribute.
                        You could skip this step if you want to invoke your app using native ESM, and don't mind loading lots of little script files.
                    </p>
                </li>
            </ol>
            <p>
                Next, create your app code.
            </p>
            { codeSample(`
                import { track } from "mutraction-dom";
                const model = track({ message: "" });
                const app = <p>Message: { model.message }</p>;
                document.body.append(app);

                model.message = "I 💖 mutating";
                `, undefined, "src/index.tsx"
            ) }
            <p>
                Almost there.  We need a host html file to load the app.
            </p>
            { codeSample(`
                <!DOCTYPE html>
                <html>
                  <head>
                    <title>mutracted dom</title>
                    <script src="dist/index.js"></script>
                  </head>
                </html>                
                `, undefined, "index.html"
            ) }
            <p>
                Now build and run.
            </p>
            { codeSample("npm run build") }
            <p>
                You can open <code>index.html</code> in your browser right from where it is.
                You can also load it through a development server, but you don't need to.
            </p>
        </>
    );
}
