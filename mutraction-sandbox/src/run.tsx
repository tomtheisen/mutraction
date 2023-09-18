import { compress, decompress } from "./compress.js";

async function init() {
    if (location.hash.length <= 1) location.href = "./";
    const { src, js } = JSON.parse(await decompress(location.hash.substring(1)));
    document.body.append(<script type="module" textContent={ js } />);

    const compressedSrc = await compress(src);
    const link = (document.getElementById("mu-sandbox-link-template") as HTMLTemplateElement).content;
    link.querySelectorAll("a").forEach((a: HTMLAnchorElement) => a.href += compressedSrc);
    document.body.append(link);
}

init();
