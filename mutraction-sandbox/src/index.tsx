import { muLogo } from "./mulogo.js";
import { PromiseLoader, Swapper, effect, makeLocalStyle, track, version } from "mutraction-dom";
import { compress, decompress } from "./compress.js";
import { defaultSource } from "./defaultSource.js";
import type * as monacoType from "monaco-editor";
import { getJsxDts, getMutractionDom as getMutractionDomDts } from "./mutractionDomModuleTypeSource.js";
import { getScaffoldZipUrl } from "./makeZip.js";
import { getSelfContainedUrl } from "./selfContained.js";
import { muCompile } from "./compile.js";
import { getShortLink } from "./shortLinks.js";

const storageKey = "mu_playground_source";

const query = new URL(location.href).searchParams;
const appState = track({
    view: (query.get("view") ?? "normal") as "normal" | "code" | "preview",
    outpane: "app" as "app" | "js",
    compiledCode: "",
    shortLinkLoading: false,
    shortLink: "",
    shortLinkError: "",    
    shortRunLinkLoading: false,
    shortRunLink: "",
    shortRunLinkError: "",    
    shortLinkDialogOpen: false,
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
    <button onclick={ share }>
        Share <small className="narrow-hide">(<kbd>ctrl + S</kbd>)</small>
    </button>;

const sourceBox = <div className="editBox" /> as HTMLDivElement;

effect(() => {
    sourceBox.style.width =
        appState.view === "code" ? "100vw" 
        : appState.view === "preview" ? "0"
        : "50vw";
    sourceBox.style.minWidth = appState.view === "normal" ? "10vw" : "";
    sourceBox.style.maxWidth = appState.view === "normal" ? "90vw" : "";
    
    // set URL parameter
    const query = new URL(location.href).searchParams;
    query.set("view", appState.view);
    history.replaceState(null, "", "?" + String(query) + location.hash);
});

const frame = <iframe src="output.html" hidden={ appState.outpane !== "app" } /> as HTMLIFrameElement;
const jsOutput = <output style={{ display: appState.outpane === "js" ? "block" : "none" }} textContent={ appState.compiledCode } /> as HTMLOutputElement;

async function getRunLink(src: string) {
    const js = await muCompile(src);
    return "run.html#" + await compress(JSON.stringify({ src, js }));
}

function hamburger() {
    const hamburgerState = track({ 
        isActive: false, 
        downloadScaffoldLink: Promise.resolve(""), 
        downloadSelfContainedLink: Promise.resolve(""),
        runLink: Promise.resolve(""),
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

    effect(function hamburgerEffect() {
        if (hamburgerState.isActive) {
            document.body.addEventListener("mousedown", outClickHandler, { capture: true });
            window.addEventListener("blur", () => hamburgerState.isActive = false, { once: true });
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
                    <li>
                        { Swapper(() => PromiseLoader(
                            hamburgerState.runLink.then(url =>
                                <a target="_blank" href={url}>🛣️ Run standalone</a>),
                                <a>Compressing …</a>,
                                err => <a className="err">{ err }</a>
                        )) }
                    </li>
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

function run(code: string | undefined = "") {
    if (!code) return;

    sessionStorage.setItem(storageKey, code);
    try {
        appState.compiledCode = muCompile(code);
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
    }
}

window.addEventListener("message", ev => {
    switch (ev.data.type) {
        case "run": 
            run();
            break;

        case "save":
            share();
            break;

        case "zen":
            document.firstElementChild?.classList.toggle("zen");
            break;

        case "display":
            appState.view = ev.data.displayType;
            break;
    }
});

window.addEventListener("keydown", ev => {
    if (ev.key === "Enter" && ev.ctrlKey) {
        run();
    }
    else if ((ev.key === "s" || ev.key ==="S") && ev.ctrlKey && !ev.shiftKey) {
        ev.preventDefault();
        share();
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
    else if (ev.key === "0" && ev.altKey) {
        window.postMessage({ type: "zen" });
    }
    else if (appState.shortLinkDialogOpen && ev.key === "Escape") {
        appState.shortLinkDialogOpen = false;
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
    appState.view = "normal";
    sourceBox.style.width = ev.pageX + "px";
    ev.stopPropagation();
}

async function share() {
    appState.shortLinkLoading = appState.shortLinkDialogOpen = true;
    appState.shortRunLinkError = appState.shortLinkError = "";
    appState.shortRunLink = appState.shortLink = "";
}

async function doCopy(val: string) {
    try {
        await navigator.clipboard.writeText(val);
        notify("URL copied to clipboard");
    }
    catch (err) {
        console.error(err);
        notify("Failed to copy: " + String(err));
    }
}

const dialog = 
    <dialog>
        <h4>Share Sandbox Link</h4>
        <button className="close" onclick={ () => appState.shortLinkDialogOpen = false }>
            &times;
        </button>

        <p mu:if={ !!appState.shortLink }>
            <button onclick={ () => doCopy(appState.shortLink) }>Copy</button>
            Sandbox: <a target="_blank" href={ appState.shortLink }>{ appState.shortLink }</a>
        </p>
        <p mu:else mu:if={ appState.shortLinkLoading }>Loading …</p>
        <p mu:else mu:if={ !!appState.shortLinkError }>
            { appState.shortLinkError }<br/>
            You can still use the long link in the URL bar.
        </p>

        <p mu:if={ !!appState.shortRunLink }>
            <button onclick={ () => doCopy(appState.shortRunLink) }>Copy</button>
            Standalone: <a target="_blank" href={ appState.shortRunLink }>{ appState.shortRunLink }</a>
        </p>
        <p mu:else mu:if={ appState.shortRunLinkLoading }>Loading …</p>
        <p mu:else mu:if={ !!appState.shortRunLinkError }>
            { appState.shortRunLinkError }<br/>
            You can still use the long link in the URL bar.
        </p>
    </dialog> as HTMLDialogElement;

effect(() => {
    if (appState.shortLinkDialogOpen) dialog.showModal();
    else dialog.close();
});

const app =
    <>
        <header>
            <div style={{ position: "relative", top: "4px", zIndex: "1" }}>
                <a href="/">{ muLogo(50) }</a>
            </div>
            <h1 className="narrow-hide">sandbox</h1>
            { hamburger() }{ runButton }{ saveButton }
            <div style={{ flexGrow: "1" }}></div>
            <span className="narrow-hide" style={{ padding: "1em", color: "#fff6" }}>
                mutraction-dom<wbr />@{ version }
            </span>
        </header>
        <main>
            { sourceBox }
            <div id="sizer" onmousedown={ startSizing }></div>
            <div className="outpane">
                <div className="outcontrols">
                    <menu>
                        <li classList={{ active: appState.outpane === "app"}}><a onclick={ () => appState.outpane = "app" }>App</a></li>
                        <li classList={{ active: appState.outpane === "js"}}><a onclick={ () => appState.outpane = "js" }>JS output</a></li>
                    </menu>
                </div>
                { frame }
                { jsOutput }
            </div>
        </main>
    </>;

document.body.append(app, dialog);

async function init() {
    const source = location.hash.length > 1
        ? await decompress(location.hash.substring(1))
        : sessionStorage.getItem(storageKey) ?? defaultSource;
    run(source);
}
init();
