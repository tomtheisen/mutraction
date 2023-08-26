import compileJsx from "mutraction-dom/compile-jsx";
import syntaxJsx from "@babel/plugin-syntax-jsx";
import { transform } from "@babel/standalone";

const storageKey = "mu_playground_source";

const runButton = <button id="run">Run ▶️ <small>(<kbd>ctrl + enter</kbd>)</small></button>;
const sourceBox = <textarea id="source" autofocus spellcheck={false} /> as HTMLTextAreaElement;
const frame = <iframe id="frame" src="output.html"></iframe> as HTMLIFrameElement;

const app = (
    <>
        <header>
            <h1>
                <span className="primary" style={{ fontWeight: "bold", fontStyle: "italic" }}>μ</span>playground
            </h1>
            { runButton }
        </header>
        { sourceBox }{ frame }
    </>
)

sourceBox.value = sessionStorage.getItem(storageKey) ??
`import { track } from "mutraction-dom";

const model = track({ clicks: 0 });

const clicker = (
<button onclick={ () => ++model.clicks }>
    Clicks: { model.clicks }
</button>
);

document.body.append(clicker);`;

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
