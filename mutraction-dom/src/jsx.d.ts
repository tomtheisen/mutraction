/** For use with mu:apply */
type NodeModifier = {
    readonly $muType: string;
}

type ElementRef = {
    element?: HTMLElement;
}

type MutractionElement<ElementType extends keyof HTMLElementTagNameMap> = {
    [Prop in keyof HTMLElementTagNameMap[ElementType]]?:
        Prop extends "classList" ? Record<string, boolean> :
        Prop extends "style" ? Partial<CSSStyleDeclaration> :
        HTMLElementTagNameMap[ElementType][Prop];
} & {
    "class"?: string;
    "mu:if"?: boolean;
    "mu:else"?: true;
    "mu:syncEvent"?: (keyof HTMLElementEventMap) | string;
    "mu:apply"?: NodeModifier | NodeModifier[];
    "mu:ref"?: (element: HTMLElementTagNameMap[ElementType]) => void;
};

export namespace JSX {
    export type Element = Node;

    export type ElementAttributesProperty = never;

    export type IntrinsicElements = {
        [key in keyof HTMLElementTagNameMap]: MutractionElement<key>;
    };
}
