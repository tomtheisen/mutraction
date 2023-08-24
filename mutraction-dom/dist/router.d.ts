type Route = {
    pattern: RegExp | string;
    element: Node | ((match: RegExpExecArray) => Node);
    suppressScroll?: boolean;
} | {
    element: Node | (() => Node);
    suppressScroll?: boolean;
};
export declare function Router(...routes: Route[]): Node;
export {};
