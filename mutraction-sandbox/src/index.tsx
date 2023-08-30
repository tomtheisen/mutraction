import { muLogo } from "./mulogo.js";
import { effect, track, version } from "mutraction-dom";
import { compress, decompress } from "./compress.js";
import { defaultSource } from "./defaultSource.js";
import type * as monacoType from "monaco-editor";
import { jsxDTS, mutractionDomModule } from "./mutractionDomModuleTypeSource.js";
import compileJsx from "mutraction-dom/compile-jsx";
import { transform } from "@babel/standalone";
import { getScaffoldZipUrl } from "./makeZip.js";

declare const require: Function & { config: Function };
declare const monaco: typeof monacoType;

const storageKey = "mu_playground_source";

const appState = track({
    view: "normal" as "normal" | "code" | "preview",
});

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

const sourceBox = <div style={{ zIndex: "0", height: "calc(100vh - var(--header-height))" }}></div> as HTMLDivElement;

effect(() => {
    sourceBox.style.width =
        appState.view === "code" ? "100vw" 
        : appState.view === "preview" ? "0"
        : "50vw";
    sourceBox.style.minWidth = appState.view === "normal" ? "10vw" : "";
    sourceBox.style.maxWidth = appState.view === "normal" ? "90vw" : "";
    editor?.layout();
});

const frame = <iframe src="output.html"></iframe> as HTMLIFrameElement;

function hamburger() {
    const hamburgerState = track({ 
        isActive: false, 
        downloadLink: "", 
    });
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
            hamburgerState.isActive = false;
        }
    }

    effect(() => {
        if (hamburgerState.isActive) {
            document.body.addEventListener("mousedown", outClickHandler, { capture: true });
            window.addEventListener("blur", () => hamburgerState.isActive = false, { once: true });
            const code = editor?.getValue();
            if (code) getScaffoldZipUrl(code).then(link => hamburgerState.downloadLink = link);
        }
        else {
            document.body.removeEventListener("mousedown", outClickHandler, { capture: true });
        }
    });

    const hamburger = 
        <div style={ containerStyle }>
            <button style={ styles } onclick={ () => hamburgerState.isActive = !hamburgerState.isActive }>
                { hamburgerState.isActive ? '▼' : '≡' }
            </button>
            <div className="drop-list" hidden={ !hamburgerState.isActive }>
                <menu>
                    <li><a download="mutraction-project.zip" href={ hamburgerState.downloadLink }>📦 Get .zip of this app</a></li>
                    <li onclick={ () => appState.view = "code" }>
                        <a>⟺ Fullscreen editor</a>
                        <kbd>Alt + 1</kbd>
                    </li>
                    <li onclick={ () => appState.view = "preview" }>
                        <a>⟺ Fullscreen preview</a>
                        <kbd>Alt + 2</kbd>
                    </li>
                    <li onclick={ () => appState.view = "normal" }>
                        <a>⤄ Normal view</a>
                        <kbd>Alt + 3</kbd>
                    </li>
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

        // if you run, you want to see output
        if (appState.view === "code") appState.view = "normal";
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

window.addEventListener("keydown", ev => {
    if (ev.key === "Enter" && ev.ctrlKey) {
        run();
    }
    else if (ev.key === "s" && ev.ctrlKey) {
        ev.preventDefault();
        save();
    }
    else if (ev.key === "1" && ev.altKey) {
        appState.view = "code";
    }
    else if (ev.key === "2" && ev.altKey) {
        appState.view = "preview";
    }
    else if (ev.key === "3" && ev.altKey) {
        appState.view = "normal";
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

const app =
    <>
        <header>
            <div style={{ position: "relative", top: "4px", zIndex: "1" }}>{ muLogo(50) }</div>
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
    </>;

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
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({ 
            ...existing,
            jsx: monaco.languages.typescript.JsxEmit.Preserve,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            jsxImportSource: "mutraction-dom",
        });

        // mutraction typedefs
        monaco.languages.typescript.typescriptDefaults.addExtraLib(mutractionDomModule, "mutraction-dom.ts");

        // jsx types
        monaco.languages.typescript.typescriptDefaults.addExtraLib(jsxDTS, "file:///node_modules/mutraction-dom/jsx-runtime/index.d.ts");
        
        // create the editor
        editor = monaco.editor.create(sourceBox, { 
            language: 'typescript',
            minimap: { enabled: false },
            theme: "vs-dark",
        });

        // add the source code (model)
        const codeModel = monaco.editor.createModel(source, "typescript", monaco.Uri.file("mutraction_app.tsx"));
        editor.setModel(codeModel);

        // pass through Ctrl+Enter; was "editor.action.insertLineAfter"
        monaco.editor.addKeybindingRule({ keybinding: monaco.KeyCode.Enter | monaco.KeyMod.WinCtrl, command: undefined });
        monaco.editor.addKeybindingRule({ keybinding: monaco.KeyCode.Enter | monaco.KeyMod.CtrlCmd, command: undefined });
    });
}
init();

