import type { Tracker } from "mutraction-dom";

export namespace JSX {
    export type Element = Node;

    export type ElementAttributesProperty = never;

    export type MutractionElement<ElementType extends keyof HTMLElementTagNameMap> = {
        [Prop in keyof HTMLElementTagNameMap[ElementType]]?:
            Prop extends "classList" ? Record<string, boolean> :
            Prop extends "style" ? Partial<CSSStyleDeclaration> :
            HTMLElementTagNameMap[ElementType][Prop];
    }
    & {
        "mu:if"?: boolean;
        "mu:else"?: boolean;
        "mu:syncEvent"?: (keyof HTMLElementEventMap) | string;
    };

    export type IntrinsicElements = {
        [key in keyof HTMLElementTagNameMap]: MutractionElement<key>;
    };
}
