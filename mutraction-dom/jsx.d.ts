import type { Tracker } from "mutraction";

type Elements = HTMLElementTagNameMap;

export namespace JSX {
    export type MutractionElement = {
        [ElementType in keyof Elements]: {
            [PropType in keyof Elements[ElementType]]?: Elements[ElementType][PropType];
        } & {
            "mu:if"?: boolean;
            "mu:tracker"?: Tracker;
        };
    };

    export type IntrinsicElements = {
        [key in keyof Elements]: MutractionElement[key];
    }
}
