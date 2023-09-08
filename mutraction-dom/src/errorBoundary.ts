import { ElementSpan } from "./elementSpan.js";
import { ScopeTypes, enterScope, exitScope } from "./scope.js";

/**
 * Shows a node constructed from a factory unless it throws.  In that case,
 * fall back to the error node factory.
 * @param nodeFactory produces the normal content to show.
 * @param showErr produces the error fallback content in case an error is thrown.
 * @returns a DOM node
 */
export function ErrorBoundary(nodeFactory: () => Node, showErr: (err: any) => Node): Node {
    const span = new ElementSpan;
    function handleErr(err: any) {
        span.replaceWith(showErr(err));
    }
    try {
        enterScope(ScopeTypes.errorBoundary, handleErr);
        span.append(nodeFactory());
    }
    catch (err) {
        handleErr(err);
    }
    finally {
        exitScope(ScopeTypes.errorBoundary);
    }
    return span.removeAsFragment();
}
