export declare function ForEach<TIn, TOut extends Node>(array: TIn[], map: (item: TIn, index: number, array: TIn[]) => TOut): Node;
export declare function ForEachPersist<TIn extends object>(array: TIn[], map: (e: TIn) => Node): Node;
type ElementStringProps<E extends keyof HTMLElementTagNameMap> = {
    [K in keyof HTMLElementTagNameMap[E]]: HTMLElementTagNameMap[E][K] extends string ? string : never;
};
type ElementPropGetters<E extends keyof HTMLElementTagNameMap> = {
    [K in keyof HTMLElementTagNameMap[E]]: () => HTMLElementTagNameMap[E][K];
};
export declare function element<E extends keyof HTMLElementTagNameMap>(name: E, staticAttrs: ElementStringProps<E>, dynamicAttrs: ElementPropGetters<E>, ...children: (Node | string)[]): HTMLElementTagNameMap[E] | Text;
export declare function child(getter: () => number | string | bigint | null | undefined | HTMLElement | Text): ChildNode;
export {};
