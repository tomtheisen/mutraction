import compileJsx from "mutraction-dom/compile-jsx";
import { transform } from "@babel/standalone";
import { sourceBox, storageKey, frame } from "./index.js";

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

export function run() {
    const code = sourceBox.value;
    sessionStorage.setItem(storageKey, code);
    frame.addEventListener("load", ev => {
        frame.contentWindow?.postMessage(compiled, "*");
    }, { once: true });
    frame.contentWindow?.location.reload();
    const compiled = muCompile(code);
}
