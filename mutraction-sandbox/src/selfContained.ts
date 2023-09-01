import { decompress } from "./compress.js"

const selfContainedTemplate = decompress("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");

let lastUrl: string | undefined;
export async function getSelfContainedUrl(appSource: string) {
    if (lastUrl) URL.revokeObjectURL(lastUrl);
    
    const html = (await selfContainedTemplate).replace("__MU_TEMPLATE_SOURCE__", appSource);
    const blob = new Blob([html]);
    lastUrl = URL.createObjectURL(blob);
    return lastUrl;
}
