type Route = {
    pattern: RegExp;
    element: Node | ((match: RegExpExecArray) => Node);
} | {
    element: Node;
};
export declare function Router(...routes: Route[]): Node;
export {};
