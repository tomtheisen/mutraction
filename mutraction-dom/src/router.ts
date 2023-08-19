import { ElementSpan } from './elementSpan.js';

type Route = {
    pattern: RegExp | string;
    element: Node | ((match: RegExpExecArray) => Node);
} | {
    element: Node | (() => Node);
}

export function Router(...routes: Route[]): Node {
    if (routes.some(route => "pattern" in route && route.pattern instanceof RegExp && route.pattern.global))
        throw Error("Global-flagged route patterns not supported");

    const container = new ElementSpan();

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
            const element = route.element;

            if (match) {
                const newNode = typeof element === "function" ? element(execResult!) : element;
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