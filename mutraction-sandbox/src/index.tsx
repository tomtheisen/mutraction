import { muLogo } from "./mulogo.js";
import { effect, track, version } from "mutraction-dom";
import { compress, decompress } from "./compress.js";
import { defaultSource } from "./defaultSource.js";
import type * as monacoType from "monaco-editor";
import { mutractionDomModule } from "./mutractionDomModuleTypeSource.js";
import compileJsx from "mutraction-dom/compile-jsx";
import { transform } from "@babel/standalone";
import { getScaffoldZipUrl } from "./makeZip.js";

declare const require: Function & { config: Function };
declare const monaco: typeof monacoType;

export const storageKey = "mu_playground_source";

function notify(message: string) {
    const notify = <div className="notification">{ message }</div> as HTMLDivElement;
    document.body.append(notify);
    setTimeout(() => notify.remove(), 1e3);
}

const runButton =
    <button onclick={ () => run() }>
        Run ▶️ <small className="narrow-hide">(<kbd>ctrl + enter</kbd>)</small>
    </button>;

const saveButton = 
    <button onclick={ save }>
        Share <small className="narrow-hide">(<kbd>ctrl + S</kbd>)</small>
    </button>;

const sourceBox = 
    <div style={{ height: "100%", width: "50vw", minWidth: "10vw", maxWidth: "90vw", zIndex: "0" }}>
    </div> as HTMLDivElement;

const frame = <iframe src="output.html"></iframe> as HTMLIFrameElement;

function hamburger() {
    const model = track({ isActive: false, downloadLink: "" });
    const containerStyle = {
        display: "inline-block",
        height: "var(--button-height)",
        zIndex: "1",        
    };
    const styles = {
        fontFamily: "monospace",
        fontSize: "240%", 
    };

    function outClickHandler(ev: Event) {
        if (ev.target instanceof Node && !hamburger.contains(ev.target)) {
            model.isActive = false;
        }
    }

    effect(() => {
        if (model.isActive) {
            document.body.addEventListener("mousedown", outClickHandler, { capture: true });
            window.addEventListener("blur", () => model.isActive = false, { once: true });
            const code = editor?.getValue();
            if (code) getScaffoldZipUrl(code).then(link => model.downloadLink = link);
        }
        else {
            document.body.removeEventListener("mousedown", outClickHandler, { capture: true });
        }
    });

    const hamburger = 
        <div style={ containerStyle }>
            <button style={ styles } onclick={ () => model.isActive = !model.isActive }>
                { model.isActive ? '▼' : '≡' }
            </button>
            <div className="drop-list" hidden={ !model.isActive }>
                <menu>
                    <li><a download="mutraction-project.zip" href={ model.downloadLink }>📦 Get .zip of this app</a></li>
                </menu>
            </div>
        </div>;
    return hamburger;
}

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
    notify(message);
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

function muCompile(source: string) {
    const options = { 
        plugins: [
            ["transform-typescript", { isTSX: true }],
            compileJsx,
        ],
    };
    const { code } = transform(source, options);
    return code ?? "";
}

export function run(code: string | undefined = editor?.getValue()) {
    if (!code) return;

    sessionStorage.setItem(storageKey, code);
    try {
        const compiled = muCompile(code);
        frame.addEventListener("load", ev => {
            frame.contentWindow?.postMessage(compiled, "*");
        }, { once: true });
        frame.contentWindow?.location.reload();
    }
    catch (err) {
        if (err instanceof Error) {
            notify(err.message);
        }
        else {
            notify(String(err));
        }
    }
}

const app = (
    <>
        <header>
            <div style={{ position: "relative", top: "4px" }}>{ muLogo(50) }</div>
            <h1>sandbox</h1>
            { hamburger() }{ runButton }{ saveButton }
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
        // ts compiler options
        const existing = monaco.languages.typescript.typescriptDefaults.getCompilerOptions();
        const JSXPreserve = 1;
        const ModuleResolutionKindClassic = 1;
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({ 
            ...existing,
            jsx: JSXPreserve,
            moduleResolution: ModuleResolutionKindClassic,
        });

        // mutraction typedefs
        monaco.languages.typescript.typescriptDefaults.addExtraLib(mutractionDomModule, "mutraction-dom.ts");

        // pass through Ctrl+Enter
        // was "editor.action.insertLineAfter"
        monaco.editor.addKeybindingRule({ keybinding: monaco.KeyCode.Enter | monaco.KeyMod.WinCtrl, command: undefined });
        monaco.editor.addKeybindingRule({ keybinding: monaco.KeyCode.Enter | monaco.KeyMod.CtrlCmd, command: undefined });

        // create the editor
        editor = monaco.editor.create(sourceBox, { 
            language: 'typescript',
            minimap: { enabled: false },
            theme: "vs-dark",
        });

        // add the source code (model)
        const modelUri = monaco.Uri.file("foo.tsx")
        const codeModel = monaco.editor.createModel(source, "typescript", modelUri);
        editor.setModel(codeModel);
    });
}
init();

