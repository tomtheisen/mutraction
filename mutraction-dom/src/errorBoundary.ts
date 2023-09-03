/**
 * Shows a node constructed from a factory unless it throws.  In that case,
 * fall back to the error node factory.
 * @param nodeFactory produces the normal content to show.
 * @param showErr produces the error fallback content in case an error is thrown.
 * @returns a DOM node
 */
export function ErrorBoundary(nodeFactory: () => Node, showErr: (err: any) => Node) {
    try { return nodeFactory(); }
    catch (ex) { return showErr(ex); }
}
