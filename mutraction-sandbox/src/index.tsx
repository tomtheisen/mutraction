// import { parseSync, parseAsync, transform } from "@babel/core";
import compileJsx from "mutraction-dom/compile-jsx";
import syntaxJsx from "@babel/plugin-syntax-jsx";
import { transform } from "@babel/standalone";


let x = 0;
if (typeof compileJsx) ++x;
if (typeof syntaxJsx) ++x;
if (typeof transform) ++x;

export function muCompile(source: string) {
    const options = { plugins: [syntaxJsx, compileJsx] };
    const { code } = transform(source, options);
    if (!code) throw "No output";
    return code;
}

const code = `
console.log(123);
const jsx = <div>hi</div>;
`;
console.log(muCompile(code));
