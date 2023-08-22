import _jsTokens from "js-tokens";

// typescript bug?
const jsTokens = _jsTokens as unknown as typeof _jsTokens.default;

function dedent(s: string) {
    const prefix = /\n[ \t]*$/.exec(s);
    if (!prefix) return s; // one-liner
    s = s.replaceAll(prefix[0], "\n"); // dedent
    s = s.replace(/^[ \t]*\n/, ""); // leading blank line
    s = s.trimEnd(); // trailing spaces

    const frag = document.createDocumentFragment();
    for (const token of jsTokens(s, { jsx: true })) {
        frag.append(token.type === "WhiteSpace" || token.type === "LineTerminatorSequence"
            ? token.value
            : <span className={ token.type }>{ token.value }</span>);
    }
    return frag;
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
