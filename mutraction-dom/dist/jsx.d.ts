import type { Tracker } from "mutraction";

export namespace JSX {
    interface StandardElement {
        if?: boolean;
        tracker?: Tracker;
    }

    export type IntrinsicElements = {
        [key in keyof HTMLElementTagNameMap]: StandardElement & Partial<HTMLElementTagNameMap[key]>;
    }
}
