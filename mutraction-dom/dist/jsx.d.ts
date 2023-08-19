import type { Tracker } from "mutraction";

type PartialIfObject<T> = T extends undefined | string | number | boolean | bigint | symbol | any[] | Function
    ? T
    : Partial<T>;

export namespace JSX {
    export type Element = Node;

    export type ElementAttributesProperty = never;

    export type MutractionElement<ElementType extends keyof HTMLElementTagNameMap> = {
        [PropType in keyof HTMLElementTagNameMap[ElementType]]?: 
            PartialIfObject<HTMLElementTagNameMap[ElementType][PropType]>;
    }
    & {
        "mu:if"?: boolean;
        "mu:else"?: boolean;
    };

    export type IntrinsicElements = {
        [key in keyof HTMLElementTagNameMap]: MutractionElement<key>;
    };
}
