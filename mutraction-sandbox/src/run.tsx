import { decompress } from "./compress.js";

async function init() {
    if (location.hash.length <= 1) location.href = "./";
    const { src, js } = JSON.parse(await decompress(location.hash.substring(1)));
    document.body.append(<script type="module" textContent={ js } />);
}

init();
