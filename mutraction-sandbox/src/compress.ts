const format = "deflate-raw";

/** compresses a string to base-64 */
export async function compress(data: string): Promise<string> {
    const blob = new Blob([new TextEncoder().encode(data)]);
    const stream = blob.stream().pipeThrough(new CompressionStream(format));
    const response = new Response(stream);
    const buffer = await response.arrayBuffer();
    const binaryString = Array.from(new Uint8Array(buffer), b => String.fromCharCode(b)).join('');
    return btoa(binaryString);
}

/** decompress from base-64 */
export async function decompress(data: string): Promise<string> {
    const binaryString = atob(data);
    const bytes = Uint8Array.from<string>(binaryString, c => c.charCodeAt(0)!);
    const blob = new Blob([bytes]);
    const stream = blob.stream().pipeThrough(new DecompressionStream(format));
    const response = new Response(stream);
    return await response.text();
}
