import { readFileSync, writeFileSync } from "node:fs";

const { version } = JSON.parse(readFileSync("package.json", { encoding: "utf-8" }));
let index = readFileSync("out/index.js", { encoding: "utf-8" });
index = index.replace("__VER__", version);
writeFileSync("out/index.js", index);

console.log("Injected version", version);
