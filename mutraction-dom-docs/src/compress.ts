const format = "deflate-raw";

/** compresses a string to base-64 */
async function compress(data: string): Promise<string> {
    const blob = new Blob([new TextEncoder().encode(data)]);
    const stream = blob.stream().pipeThrough(new CompressionStream(format));
    const response = new Response(stream);
    const buffer = await response.arrayBuffer();
    const binaryString = Array.from(new Uint8Array(buffer), b => String.fromCharCode(b)).join('');
    return btoa(binaryString);
}

export async function getSandboxLink(body: string, neededImports: string[] = []) {
    if (neededImports.length) {
        body = `import { ${ neededImports.join(", ") } } from "mutraction-dom";\n\n` + body;
    }
    return `sandbox/#` + await(compress(body));
}