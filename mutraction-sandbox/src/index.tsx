import compileJsx from "mutraction-dom/compile-jsx";
import syntaxJsx from "@babel/plugin-syntax-jsx";
import { transform } from "@babel/standalone";
import { muLogo } from "./mulogo.js";
import { version } from "mutraction-dom";

const storageKey = "mu_playground_source";

const runButton = <button id="run">Run ▶️ <small>(<kbd>ctrl + enter</kbd>)</small></button>;
const sourceBox = <textarea id="source" autofocus spellcheck={false} /> as HTMLTextAreaElement;
const frame = <iframe id="frame" src="output.html"></iframe> as HTMLIFrameElement;

sourceBox.value = sessionStorage.getItem(storageKey) ??
`import { track } from "mutraction-dom";

const model = track({ clicks: 0 });

const clicker = (
<button onclick={ () => ++model.clicks }>
    Clicks: { model.clicks }
</button>
);

document.body.append(clicker);`;

const app = (
    <>
        <header>
            <div style={{ position: "relative", top: "4px" }}>{ muLogo(50) }</div>
            <h1>sandbox</h1>
            { runButton }
            <div style={{ flexGrow: "1" }}></div>
            <span style={{ padding: "1em", color: "#fff6" }}>v{ version }</span>
        </header>
        { sourceBox }{ frame }
    </>
);

export function muCompile(source: string) {
    const options = { plugins: [syntaxJsx, compileJsx] };
    const { code } = transform(source, options);
    return code ?? "";
}

function run() {
    const code = sourceBox.value;
    sessionStorage.setItem(storageKey, code);
    const compiled = muCompile(code);
    frame.contentWindow?.location.reload();
    frame.addEventListener("load", ev => {
        frame.contentWindow?.postMessage(compiled, "*");
    }, { once: true });
}

runButton.addEventListener("click", run);
window.addEventListener("keydown", ev => {
    if (ev.key === "Enter" && ev.ctrlKey) run();
});

if (sourceBox.value) run();

document.body.append(app);
