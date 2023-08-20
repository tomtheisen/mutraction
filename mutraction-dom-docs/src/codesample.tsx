function dedent(s: string) {
    const prefix = /\n[ \t]*$/.exec(s)!;
    return s.replaceAll(prefix[0], "\n").trim();
}

export function codeSample(code: string, output?: Node) {
    return (
        <figure>
            <code>{ dedent(code) }</code>
            <output mu:if={ output != null }>{ output }</output>
        </figure>
    );
}