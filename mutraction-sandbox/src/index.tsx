import compileJsx from "mutraction-dom/compile-jsx";
import syntaxJsx from "@babel/plugin-syntax-jsx";
import { transform } from "@babel/standalone";

const storageKey = "mu_playground_source";

export function muCompile(source: string) {
    const options = { plugins: [syntaxJsx, compileJsx] };
    const { code } = transform(source, options);
    return code ?? "";
}

const sourceBox = document.getElementById("source") as HTMLInputElement;
const runButton = document.getElementById("run")!;
const frame = document.getElementById("frame") as HTMLIFrameElement;

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
