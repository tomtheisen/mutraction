export class ElementSpan {
    readonly startMarker = document.createTextNode("");
    readonly endMarker = document.createTextNode("");

    constructor(...node: Node[]) {
        const frag = document.createDocumentFragment();
        frag.append(this.startMarker, ...node, this.endMarker);
    }

    getFragment(): DocumentFragment {
        if (this.startMarker.parentNode instanceof DocumentFragment) {
            return this.startMarker.parentNode;
        }
        const nodes: Node[] = [];
        for (const walk = document.createTreeWalker(this.startMarker); ; walk.nextSibling()) {
            if (walk.currentNode == null)
                throw Error("End marker not found as subsequent document sibling as start marker");
            nodes.push(walk.currentNode);
            if (Object.is(walk.currentNode, this.endMarker)) break;
        }
        
        const result = document.createDocumentFragment();
        result.append(...nodes);
        return result;
    }

    replaceWith(...node: Node[]) {
        while (!Object.is(this.startMarker.nextSibling, this.endMarker)) {
            if (this.startMarker.nextSibling == null)
                throw Error("End marker not found as subsequent document sibling as start marker");
            this.startMarker.nextSibling.remove();
        }

        const frag = document.createDocumentFragment();
        frag.append(...node);

        if (!this.endMarker.parentNode)
            throw Error("End marker of ElementSpan has no parent");

        this.endMarker.parentNode.insertBefore(frag, this.endMarker);
    }
}
