export namespace JSX {
    interface StandardElement {
        if?: () => boolean;
    }

    export type IntrinsicElements = {
        [key in keyof HTMLElementTagNameMap]: StandardElement & Partial<HTMLElementTagNameMap[key]>;
    }
}
