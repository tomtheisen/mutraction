import jsTokens from "js-tokens";
import { getSandboxLink } from "./compress.js";
import { PromiseLoader } from "mutraction-dom";

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
    sandboxLink?: boolean;
    sandboxImports?: string[];
    docAppend?: string;
}
export function codeSample(code: string, output?: Node, options?: CodeSampleOptions): Node {
    const { caption, highlight = true, sandboxLink = false, sandboxImports, docAppend } = options ?? {};

    const dedented = dedent(code);
    let codeFormatted: string | Node = dedented;
    if (highlight) codeFormatted = syntaxHighlight(codeFormatted);

    async function getLink(): Promise<Node> {
        const sandboxCode = docAppend
            ? dedented + `\n\ndocument.body.append(${ docAppend });\n`
            : dedented + "\n"
        const href = await getSandboxLink(sandboxCode, sandboxImports);
        return <a className="tryit" href={ href }>Try it ⤴️</a>;
    }

    return (
        <figure>
            <figcaption mu:if={ caption != null }>{ caption }</figcaption>
            <code>{ codeFormatted }</code>
            <output mu:if={ output != null }>{ output }</output>
            { sandboxLink ? PromiseLoader(getLink()) : <></> }
        </figure>
    );
}
