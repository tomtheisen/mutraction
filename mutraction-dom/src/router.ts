import { ElementSpan } from './ElementSpanx.js';

type Route = {
    pattern: RegExp;
    element: (match: RegExpExecArray) => Node;
}

export function Router(...routes: Route[]) {
    if (routes.some(route => route.pattern.global))
        throw Error("Global-flagged route patterns not supported");

    const container = new ElementSpan();
    
    window.addEventListener("hashchange", ev => {
        const { hash } = new URL(ev.newURL);

        for (const { pattern, element } of routes) {
            const match = pattern.exec(hash);

            if (match) {
                container.replaceWith(element(match));
                return;
            }
        }
        container.emptyAsFragment();
    });

    return container;
}