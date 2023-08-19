import { ElementSpan } from './elementSpan.js';

type Route = {
    pattern: RegExp;
    element: Node | ((match: RegExpExecArray) => Node);
} | {
    element: Node | (() => Node);
}

export function Router(...routes: Route[]): Node {
    if (routes.some(route => "pattern" in route && route.pattern.global))
        throw Error("Global-flagged route patterns not supported");

    const container = new ElementSpan();

    function hashChangeHandler(url: string) {
        const { hash } = new URL(url);

        for (const route of routes) {
            const pattern = "pattern" in route ? route.pattern : undefined;
            const match = pattern?.exec(hash);
            const element = route.element;

            if (match || pattern == null) {
                const newNode = typeof element === "function" ? element(match!) : element;
                container.replaceWith(newNode);
                return;
            }
        }
        container.emptyAsFragment();
    }
    
    window.addEventListener("hashchange", ev => hashChangeHandler(ev.newURL));
    hashChangeHandler(location.href);

    return container.removeAsFragment();
}