function dedent(s: string) {
    const prefix = /\n[ \t]*$/.exec(s);
    if (!prefix) return s; // one-liner
    s = s.replaceAll(prefix[0], "\n"); // dedent
    s = s.replace(/^[ \t]*\n/, ""); // leading blank line
    s = s.trimEnd(); // trailing spaces
    return s;
}

export function codeSample(code: string, output?: Node, caption?: string): Node {
    return (
        <figure>
            <figcaption mu:if={ caption != null }>{ caption }</figcaption>
            <code>{ dedent(code) }</code>
            <output mu:if={ output != null }>{ output }</output>
        </figure>
    );
}