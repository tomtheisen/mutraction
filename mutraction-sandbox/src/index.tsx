import { muLogo } from "./mulogo.js";
import { PromiseLoader, Swapper, effect, track, version } from "mutraction-dom";
import { compress, decompress } from "./compress.js";
import { defaultSource } from "./defaultSource.js";
import type * as monacoType from "monaco-editor";
import { jsxDTS, mutractionDomModule } from "./mutractionDomModuleTypeSource.js";
import { getScaffoldZipUrl } from "./makeZip.js";
import { getSelfContainedUrl } from "./selfContained.js";
import { muCompile } from "./compile.js";

declare const require: Function & { config: Function };
declare const monaco: typeof monacoType;

const storageKey = "mu_playground_source";

const query = new URL(location.href).searchParams;
const appState = track({
    view: query.get("view") ?? "normal" as "normal" | "code" | "preview",
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
    
    // set URL parameter
    const query = new URL(location.href).searchParams;
    query.set("view", appState.view);
    history.replaceState(null, "", "?" + String(query) + location.hash);
});

const frame = <iframe src="output.html"></iframe> as HTMLIFrameElement;

function hamburger() {
    const hamburgerState = track({ 
        isActive: false, 
        downloadScaffoldLink: Promise.resolve(""), 
        downloadSelfContainedLink: Promise.resolve(""),
    });
    const containerStyle = {
        display: "inline-block",
        height: "var(--button-height)",
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
            if (code) {
                hamburgerState.downloadScaffoldLink = getScaffoldZipUrl(code);
                hamburgerState.downloadSelfContainedLink = getSelfContainedUrl(code);
            }
        }
        else {
            document.body.removeEventListener("mousedown", outClickHandler, { capture: true });
        }
    });

    const hamburger = 
        <div style={ { ...containerStyle, zIndex: hamburgerState.isActive ? "1" : "" } }>
            <button style={ styles } onclick={ () => hamburgerState.isActive = !hamburgerState.isActive }>
                { hamburgerState.isActive ? '▼' : '≡' }
            </button>
            <div className="drop-list" hidden={ !hamburgerState.isActive }>
                <menu>
                    <li>
                        { Swapper(() => PromiseLoader(
                            hamburgerState.downloadScaffoldLink.then(url =>
                                <a download="mutraction-project.zip" href={ url }>📦 Get .zip of this app</a>),
                            <a>Compressing …</a>,
                            err => <a className="err">{ err }</a>
                        )) }
                    </li>
                    <li>
                        { Swapper(() => PromiseLoader(
                            hamburgerState.downloadSelfContainedLink.then(url =>
                                <a download="app.html" href={ url }>📄 Download as self-contained .html</a>),
                            <a>Compressing …</a>,
                            err => <a className="err">{ err }</a>
                        )) }
                    </li>
                    <li onclick={ () => editor?.setValue(defaultSource) }><a>✨ New</a></li>
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
        const style: Partial<CSSStyleDeclaration> = {
            whiteSpace: "pre",
            fontFamily: "monospace",
            color: "#ff9e9e",
            padding: "1em",
            position: "relative",
            overflowX: "auto",            
        };
        const clearStyle: Partial<CSSStyleDeclaration> = {
            position: "absolute",
            top: "1em",
            right: "0",
        };
        const el = 
            <div style={ style }>
                <button style={clearStyle} onclick={ () => editor?.setBanner(null, 20) }>✕</button>
                { err instanceof Error ? err.message : String(err) }
            </div> as HTMLElement;
        editor?.setBanner(el, 20);
        if (err && typeof err === "object" && "loc" in err) {
            const { line = undefined, column = undefined } = err?.loc ?? {} as any;
            if (typeof line === "number" && typeof column === "number") {
                editor?.revealLineInCenter(line);
                editor?.setPosition({ lineNumber: line, column: column });
            }
        }
    }
}

window.addEventListener("keydown", ev => {
    if (ev.key === "Enter" && ev.ctrlKey) {
        run();
    }
    else if ((ev.key === "s" || ev.key ==="S") && ev.ctrlKey && !ev.shiftKey) {
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
            <div style={{ position: "relative", top: "4px", zIndex: "1" }}>
                <a href="/">{ muLogo(50) }</a>
            </div>
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

        }, {
            
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
