import { Tracker } from 'mutraction';
export declare function setTracker(newTracker: Tracker): void;
export declare function clearTracker(): void;
export declare function ForEach<TIn, TOut extends Node>(array: TIn[], map: (e: TIn) => TOut): Node;
export declare function ForEachPersist<TIn extends object>(array: TIn[], map: (e: TIn) => Node): Node;
type AttributeType<E extends keyof HTMLElementTagNameMap, K extends keyof HTMLElementTagNameMap[E]> = K extends "style" ? Partial<CSSStyleDeclaration> : K extends "classList" ? Record<string, boolean> : HTMLElementTagNameMap[E][K];
type StandardAttributes = {
    if?: boolean;
};
type ElementProps<E extends keyof HTMLElementTagNameMap> = {
    [K in keyof HTMLElementTagNameMap[E]]?: AttributeType<E, K>;
} & StandardAttributes;
type ElementPropGetters<E extends keyof HTMLElementTagNameMap> = {
    [K in keyof ElementProps<E>]: () => ElementProps<E>[K];
};
export declare function element<E extends keyof HTMLElementTagNameMap>(name: E, staticAttrs: ElementProps<E>, dynamicAttrs: ElementPropGetters<E>, ...children: (Node | string)[]): HTMLElementTagNameMap[E] | Text;
export declare function child(getter: () => number | string | bigint | null | undefined | HTMLElement | Text): ChildNode;
export {};
