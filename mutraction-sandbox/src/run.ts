import { compress, decompress } from "./compress.js";

async function init() {
    if (location.hash.length <= 1) location.href = "./";
    const { src, js } = JSON.parse(await decompress(location.hash.substring(1)));
    const module = document.createElement("script");
    module.type = "module";
    module.textContent = js;
    document.body.append(module);

    const compressedSrc = await compress(src);
    const link = (document.getElementById("mu-sandbox-link-template") as HTMLTemplateElement).content;
    link.querySelectorAll("a").forEach((a: HTMLAnchorElement) => a.href += compressedSrc);
    document.body.append(link);
}

init();
