import _jsTokens from "js-tokens";

// typescript bug?
const jsTokens = _jsTokens as unknown as typeof _jsTokens.default;

function dedent(s: string) {
    const prefix = /\n[ \t]*$/.exec(s);
    if (!prefix) return s; // one-liner
    s = s.replaceAll(prefix[0], "\n"); // dedent
    s = s.replace(/^[ \t]*\n/, ""); // leading blank line
    s = s.trimEnd(); // trailing spaces
    return s;
}

function syntaxHighlight(s: string) {
    const frag = document.createDocumentFragment();
    for (const token of jsTokens(s, { jsx: true })) {
        frag.append(token.type === "WhiteSpace" || token.type === "LineTerminatorSequence"
            ? token.value
            : <span className={ token.type }>{ token.value }</span>);
    }
    return frag;
}

type CodeSampleOptions = {
    caption?: string;
    highlight?: boolean;
}
export function codeSample(code: string, output?: Node, options?: CodeSampleOptions): Node {
    const { caption, highlight = true } = options ?? {};

    let codeFormatted: string | Node = dedent(code);
    if (highlight) codeFormatted = syntaxHighlight(codeFormatted);

    return (
        <figure>
            <figcaption mu:if={ caption != null }>{ caption }</figcaption>
            <code>{ codeFormatted }</code>
            <output mu:if={ output != null }>{ output }</output>
        </figure>
    );
}
