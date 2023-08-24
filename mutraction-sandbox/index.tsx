// import { parseSync, parseAsync, transform } from "@babel/core";
import compileJsx from "mutraction-dom/compile-jsx";
import syntaxJsx from "@babel/plugin-syntax-jsx";
import { transform } from "@babel/standalone";

const code = `
console.log(123);
const jsx = <div>hi</div>;
`;

const options = { plugins: [ 
    syntaxJsx, 
    compileJsx 
] };
//*
// const ast = parseSync(code, options);

// console.log(ast?.program.body[1].declarations[0].init);

const transformed = transform(code, options);

console.log(transformed?.code);