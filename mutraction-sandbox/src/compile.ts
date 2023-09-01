import compileJsx from "mutraction-dom/compile-jsx";
import { transform } from "@babel/standalone";

export function muCompile(source: string) {
    const options = { 
        plugins: [
            ["transform-typescript", { isTSX: true }],
            compileJsx,
        ],
    };
    const { code } = transform(source, options);
    return code ?? "";
}
