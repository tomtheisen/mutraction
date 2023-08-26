import { muLogo } from "./mulogo.js";
import { version } from "mutraction-dom";
import { compress, decompress } from "./compress.js";
import { run } from "./run.js";
import { defaultSource } from "./defaultSource.js";

export const storageKey = "mu_playground_source";

const runButton = <button onclick={ run }>Run ▶️ <small className="narrow-hide">(<kbd>ctrl + enter</kbd>)</small></button>;
const saveButton = <button onclick={ save }>Share <small className="narrow-hide">(<kbd>ctrl + S</kbd>)</small></button>;
export const sourceBox = <textarea autofocus spellcheck={false} /> as HTMLTextAreaElement;
export const frame = <iframe src="output.html"></iframe> as HTMLIFrameElement;

async function initialize() {
    sourceBox.value = location.hash.length > 1
        ? await decompress(location.hash.substring(1))
        : sessionStorage.getItem(storageKey) ?? defaultSource;
    if (sourceBox.value) run();
}
initialize();

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

function startSizing() {
    document.addEventListener("mousemove", updateSize);
    document.addEventListener("mouseup", stopSizing, { once: true });
    frame.style.pointerEvents = "none";
}

function stopSizing() {
    document.removeEventListener("mousemove", updateSize);
    frame.style.pointerEvents = "auto";
}

function updateSize(ev: MouseEvent) {
    const template = `${ ev.pageX }fr 0.5em ${ document.body.scrollWidth - ev.pageX }fr`;
    document.body.style.gridTemplateColumns = template;
}

const app = (
    <>
        <header>
            <div style={{ position: "relative", top: "4px" }}>{ muLogo(50) }</div>
            <h1>sandbox</h1>
            { runButton }{ saveButton }
            <div style={{ flexGrow: "1" }}></div>
            <span className="narrow-hide" style={{ padding: "1em", color: "#fff6" }}>v{ version }</span>
        </header>
        { sourceBox }
        <div id="sizer" onmousedown={ startSizing }></div>
        { frame }
    </>
);

document.body.append(app);
