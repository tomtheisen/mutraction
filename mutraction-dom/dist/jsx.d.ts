import type { Tracker } from "mutraction";

// type ForEach<Model, Output extends Node> = {
//     in: Model[];
//     children: (model: Model) => Output;
// }

export namespace JSX {
    export type Element = Node;

    export type MutractionElement<ElementType extends keyof HTMLElementTagNameMap> = {
        [PropType in keyof HTMLElementTagNameMap[ElementType]]?: HTMLElementTagNameMap[ElementType][PropType];
    }
    & {
        "mu:if"?: boolean;
        "mu:tracker"?: Tracker;
    };

    export type IntrinsicElements = {
        [key in keyof HTMLElementTagNameMap]: MutractionElement<key>;
    } & {
        "mu:ForEach": {
            in: unknown[];
            children: (e: any) => Node;
        }
    };
}
