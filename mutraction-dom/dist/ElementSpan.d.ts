/**
 * Represents a collection of sibling DOM nodes that can be moved together.
 * It can move in and out of the document using document fragments.
 * The beginning and end are marked with a pair of empty sentinel text nodes.
 */
export declare class ElementSpan {
    static id: number;
    readonly startMarker: Text;
    readonly endMarker: Text;
    constructor(...node: Node[]);
    /** extracts the entire span as a fragment */
    removeAsFragment(): DocumentFragment;
    /** extracts the interior of the span into a fragment, leaving the span container empty */
    emptyAsFragment(): DocumentFragment;
    /** removes the interior contents of the span */
    clear(): void;
    /** replaces the interior contents of the span */
    replaceWith(...nodes: Node[]): void;
    append(...nodes: Node[]): void;
}
