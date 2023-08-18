import { getMarker } from "./getMarker.js";

/**
 * Represents a collection of sibling DOM nodes that can be moved together.
 * It can move in and out of the document using document fragments.
 * The beginning and end are marked with a pair of empty sentinel text nodes.
 */
export class ElementSpan {
    static id = 0;
    readonly startMarker = getMarker("start:" + ++ElementSpan.id);
    readonly endMarker = getMarker("end:" + ElementSpan.id);

    constructor(...node: Node[]) {
        const frag = document.createDocumentFragment();
        frag.append(this.startMarker, ...node, this.endMarker);
    }

    removeAsFragment(): DocumentFragment {
        if (this.startMarker.parentNode instanceof DocumentFragment) {
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

    clear() {
        while (!Object.is(this.startMarker.nextSibling, this.endMarker)) {
            if (this.startMarker.nextSibling == null)
                throw Error("End marker not found as subsequent document sibling as start marker");
            this.startMarker.nextSibling.remove();
        }
    }

    replaceWith(...nodes: Node[]) {
        this.clear();
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
