import { muLogo } from "./mulogo.js";
import { version, track } from "mutraction-dom";
import { compress, decompress } from "./compress.js";
import { run } from "./run.js";
import { defaultSource } from "./defaultSource.js";
import type * as monacoType from "monaco-editor";

declare const require: Function & { config: Function };
declare const monaco: typeof monacoType;

export const storageKey = "mu_playground_source";

function doRun() {
    if (editor) run(editor.getValue());
}

const runButton = (
    <button onclick={ doRun }>
        Run ▶️ <small className="narrow-hide">(<kbd>ctrl + enter</kbd>)</small>
    </button>
);
const saveButton = <button onclick={ save }>Share <small className="narrow-hide">(<kbd>ctrl + S</kbd>)</small></button>;
const sourceBox = <div style={{ height: "100%", width: "50vw", minWidth: "10vw", maxWidth: "90vw" }}></div> as HTMLDivElement;

export const frame = <iframe src="output.html"></iframe> as HTMLIFrameElement;

async function save() {
    const compressed = await compress(editor?.getValue() ?? "");
    location.hash = compressed;
    let message: string;
    try {
        await navigator.clipboard.writeText(location.href);
        message = "URL copied to clipboard";
    }
    catch {
        message = "Failed to set clipboard";
    }
    const notify = <div className="notification">{ message }</div> as HTMLDivElement;
    document.body.append(notify);
    setTimeout(() => notify.remove(), 1e3);
}

window.addEventListener("keydown", ev => {
    if (ev.key === "Enter" && ev.ctrlKey) {
        doRun();
    }
    else if (ev.key === "s" && ev.ctrlKey) {
        ev.preventDefault();
        save();
    }
});

function startSizing() {
    document.addEventListener("mousemove", updateSize, { capture: true });
    document.addEventListener("mouseup", stopSizing, { capture: true, once: true });
    frame.style.pointerEvents = "none";
}

function stopSizing() {
    document.removeEventListener("mousemove", updateSize, { capture: true });
    frame.style.pointerEvents = "auto";
}

function updateSize(ev: MouseEvent) {
    sourceBox.style.width = ev.pageX + "px";
    editor?.layout();
    ev.stopPropagation();
}

window.addEventListener("resize", ev => editor?.layout());

const app = (
    <>
        <header>
            <div style={{ position: "relative", top: "4px" }}>{ muLogo(50) }</div>
            <h1>sandbox</h1>
            { runButton }{ saveButton }
            <div style={{ flexGrow: "1" }}></div>
            <span className="narrow-hide" style={{ padding: "1em", color: "#fff6" }}>
                mutraction-dom<wbr />@{ version }
            </span>
        </header>
        { sourceBox }
        <div id="sizer" onmousedown={ startSizing }></div>
        { frame }
    </>
);

document.body.append(app);

let editor: ReturnType<typeof monaco["editor"]["create"]> | undefined;
async function init() {
    const source = location.hash.length > 1
        ? await decompress(location.hash.substring(1))
        : sessionStorage.getItem(storageKey) ?? defaultSource;
    run(source);

    // this stuff is actually async, but not awaitable
    require.config({ paths: { vs: 'monaco/vs' } });
    require(['vs/editor/editor.main'], function () {
        const existing = monaco.languages.typescript.typescriptDefaults.getCompilerOptions();
        const JSXPreserve = 1;
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({ 
            ...existing,
            jsx: JSXPreserve,
        });

        editor = monaco.editor.create(sourceBox, { 
            language: 'typescript',
            minimap: { enabled: false },
            theme: "vs-dark",
         });
        const modelUri = monaco.Uri.file("foo.tsx")
        const codeModel = monaco.editor.createModel(source, "typescript", modelUri);
        editor.setModel(codeModel);
        mainLoop();
    });
}
init();

function mainLoop() {
    // console.log("main", editor);
}
