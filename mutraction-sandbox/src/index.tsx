import compileJsx from "mutraction-dom/compile-jsx";
import syntaxJsx from "@babel/plugin-syntax-jsx";
import { transform } from "@babel/standalone";
import { muLogo } from "./mulogo.js";
import { version } from "mutraction-dom";
import { compress, decompress } from "./compress.js";

const storageKey = "mu_playground_source";

const runButton = <button onclick={ run }>Run ▶️ <small className="narrow-hide">(<kbd>ctrl + enter</kbd>)</small></button>;
const saveButton = <button onclick={ save }>Share <small className="narrow-hide">(<kbd>ctrl + S</kbd>)</small></button>;
const sourceBox = <textarea autofocus spellcheck={false} /> as HTMLTextAreaElement;
const frame = <iframe src="output.html"></iframe> as HTMLIFrameElement;

async function initialize() {
    if (location.hash.length > 1) {
        sourceBox.value = await decompress(location.hash.substring(1));
    }
    else {
        sourceBox.value = sessionStorage.getItem(storageKey) ??
`import { track } from "mutraction-dom";

const model = track({ clicks: 0 });

const clicker = (
<button onclick={ () => ++model.clicks }>
    Clicks: { model.clicks }
</button>
);

document.body.append(clicker);`;
    }
    if (sourceBox.value) run();
}
initialize();

function run() {
    function muCompile(source: string) {
        const options = { plugins: [syntaxJsx, compileJsx] };
        const { code } = transform(source, options);
        return code ?? "";
    }

    const code = sourceBox.value;
    sessionStorage.setItem(storageKey, code);
    const compiled = muCompile(code);
    frame.contentWindow?.location.reload();
    frame.addEventListener("load", ev => {
        frame.contentWindow?.postMessage(compiled, "*");
    }, { once: true });
}

async function save() {
    const compressed = await compress(sourceBox.value);
    location.hash = compressed;
    const notify = <div className="notification">URL copied to clipboard</div> as HTMLDivElement;
    document.body.append(notify);
    setTimeout(() => notify.remove(), 1e3);
}

window.addEventListener("keydown", ev => {
    if (ev.key === "Enter" && ev.ctrlKey) {
        run();
    }
    else if (ev.key === "s" && ev.ctrlKey) {
        ev.preventDefault();
        save();
    }
});

const app = (
    <>
        <header>
            <div style={{ position: "relative", top: "4px" }}>{ muLogo(50) }</div>
            <h1>sandbox</h1>
            { runButton }{ saveButton }
            <div style={{ flexGrow: "1" }}></div>
            <span className="narrow-hide" style={{ padding: "1em", color: "#fff6" }}>v{ version }</span>
        </header>
        { sourceBox }{ frame }
    </>
);

document.body.append(app);
