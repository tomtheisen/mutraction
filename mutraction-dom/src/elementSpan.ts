/**
 * Represents a collection of sibling DOM nodes that can be moved together.
 * It can move in and out of the document using document fragments.
 * The beginning and end are marked with a pair of empty sentinel text nodes.
 */
export class ElementSpan {
    static id = 0;
    readonly startMarker = document.createTextNode("");
    readonly endMarker = document.createTextNode("");

    constructor(...node: Node[]) {
        const frag = document.createDocumentFragment();
        frag.append(this.startMarker, ...node, this.endMarker);
    }

    /** extracts the entire span as a fragment */
    removeAsFragment(): DocumentFragment {
        if (this.startMarker.parentNode instanceof DocumentFragment) {
            // TODO: this is only true if this ElementSpan is the entire contents
            return this.startMarker.parentNode;
        }
        const nodes: Node[] = [];
        for (let walk: ChildNode | null | undefined = this.startMarker; ; walk = walk?.nextSibling) {
            if (walk == null)
                throw Error("End marker not found as subsequent document sibling as start marker");
            nodes.push(walk);
            if (Object.is(walk, this.endMarker)) break;
        }
        
        const result = document.createDocumentFragment();
        result.append(...nodes);
        return result;
    }

    /** extracts the interior of the span into a fragment, leaving the span container empty */
    emptyAsFragment(): DocumentFragment {
        const nodes: Node[] = [];
        for (let walk: ChildNode | null | undefined = this.startMarker.nextSibling; ; walk = walk?.nextSibling) {
            if (walk == null)
                throw Error("End marker not found as subsequent document sibling as start marker");
            if (Object.is(walk, this.endMarker)) break;
            nodes.push(walk);
        }
        
        const result = document.createDocumentFragment();
        result.append(...nodes);
        return result;
    }

    /** replaces the interior contents of the span */
    replaceWith(...nodes: Node[]) {
        this.emptyAsFragment();
        this.append(...nodes);
    }

    append(...nodes: Node[]) {
        const frag = document.createDocumentFragment();
        frag.append(...nodes);

        if (!this.endMarker.parentNode)
            throw Error("End marker of ElementSpan has no parent");

        this.endMarker.parentNode.insertBefore(frag, this.endMarker);
    }
}
