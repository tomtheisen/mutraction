import { readFileSync, writeFileSync } from "node:fs";
import child_process from "node:child_process";

const commitHash = child_process.execSync('git rev-parse --short HEAD').toString().trim();

let index = readFileSync("out/index.jsx", { encoding: "utf-8" });
index = index.replace("__COMMIT_HASH__", commitHash);
writeFileSync("out/index.jsx", index);
