import compileJsx from "mutraction-dom/compile-jsx";
import syntaxJsx from "@babel/plugin-syntax-jsx";
import { transform } from "@babel/standalone";

export function muCompile(source: string) {
    const options = { plugins: [syntaxJsx, compileJsx] };
    const { code } = transform(source, options);
    return code ?? "";
}

const sourceBox = document.getElementById("source") as HTMLInputElement;
const runButton = document.getElementById("run")!;
const frame = document.getElementById("frame") as HTMLIFrameElement;

runButton.addEventListener("click", () => {
    const code = sourceBox.value;
    const compiled = muCompile(code);
    frame.contentWindow?.postMessage(compiled, "*");
});
