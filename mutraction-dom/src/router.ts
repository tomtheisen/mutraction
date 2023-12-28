import { ElementSpan } from './elementSpan.js';

type Route = {
    pattern: RegExp | string;
    element: Node | ((match: RegExpExecArray) => Node);
    suppressScroll?: boolean;
} | {
    element: Node | (() => Node);
    suppressScroll?: boolean;
}

const fragmentMap: WeakMap<DocumentFragment, ElementSpan> = new WeakMap;

/**
 * A simple router that uses the #fragment part of the url.
 * The pattern array is iterated for a match every time the `hashchange` event fires.
 * @param routes is an array of pattern definitions
 * @returns an in-place updating DOM node
 */
export function Router(...routes: Route[]): Node {
    if (routes.some(route => "pattern" in route && route.pattern instanceof RegExp && route.pattern.global))
        throw Error("Global-flagged route patterns not supported");

    const container = new ElementSpan();

    let lastResolvedSpan: ElementSpan | undefined;
    let needsCleanup = false;
    function hashChangeHandler(url: string) {
        const { hash } = new URL(url);

        for (const route of routes) {
            let execResult: RegExpExecArray | undefined = undefined;
            let match = false;
            if ("pattern" in route) {
                if (typeof route.pattern === "string") match = hash === route.pattern;
                else match = !!(execResult = route.pattern.exec(hash) ?? undefined);
            }
            else {
                match = true;
            }

            if (match) {
                if (needsCleanup) {
                    lastResolvedSpan?.cleanup();
                }
                else {
                    lastResolvedSpan?.removeAsFragment();
                }
                lastResolvedSpan = undefined;

                const { element } = route;

                // we only clean up nodes produced by factory functions
                // if it didn't come from a function, we may need it later
                needsCleanup = typeof element === "function";
                const newNode = typeof element === "function" ? element(execResult!) : element;

                if (newNode instanceof DocumentFragment) {
                    // wrap the fragment in ElementSpan for safe-keping
                    // Normally fragments are ephemeral in that they retain their identity, but not contents
                    let span = fragmentMap.get(newNode);
                    if (!span) fragmentMap.set(newNode, span = new ElementSpan(newNode));
                    lastResolvedSpan = span;
                    container.replaceWith(span.removeAsFragment());
                }
                else {
                    lastResolvedSpan = undefined;
                    container.replaceWith(newNode);
                }
                if (!route.suppressScroll) window.scrollTo(0, 0);
                return;
            }
        }
        container.empty();
    }
    
    window.addEventListener("hashchange", ev => hashChangeHandler(ev.newURL));
    hashChangeHandler(location.href);

    return container.removeAsFragment();
}