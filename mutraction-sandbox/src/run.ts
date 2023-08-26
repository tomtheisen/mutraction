import compileJsx from "mutraction-dom/compile-jsx";
import syntaxJsx from "@babel/plugin-syntax-jsx";
import { transform } from "@babel/standalone";
import { sourceBox, storageKey, frame } from "./index.js";

function muCompile(source: string) {
    const options = { plugins: [syntaxJsx, compileJsx] };
    const { code } = transform(source, options);
    return code ?? "";
}

export function run() {
    const code = sourceBox.value;
    sessionStorage.setItem(storageKey, code);
    const compiled = muCompile(code);
    frame.contentWindow?.location.reload();
    frame.addEventListener("load", ev => {
        frame.contentWindow?.postMessage(compiled, "*");
    }, { once: true });
}
