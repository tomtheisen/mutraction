import { effect, Tracker } from 'mutraction';

let tracker: Tracker | undefined = undefined;

type AttributeType<E extends keyof HTMLElementTagNameMap, K extends keyof HTMLElementTagNameMap[E]> = 
    K extends "style" ? Partial<CSSStyleDeclaration> :
    K extends "classList" ? Record<string, boolean> :
    HTMLElementTagNameMap[E][K];

// the jsx transformer wraps all the attributes in thunks
type StandardAttributes = {
    if?: () => boolean;
    tracker?: () => Tracker;
};
type ElementProps<E extends keyof HTMLElementTagNameMap> = {
    [K in keyof HTMLElementTagNameMap[E]]?:
        () => AttributeType<E, K>;
} & StandardAttributes; 

const suppress = { suppressUntrackedWarning: true } as const;

// function element(name: string, attrs: Record<string, () => string|number|boolean>, ...children: ChildNode[]): HTMLElement;
export function element<E extends keyof HTMLElementTagNameMap>(
    name: E, 
    attrGetters: ElementProps<E>, 
    ...children: (Node | string)[]
): HTMLElementTagNameMap[E] | Text {
    const el = document.createElement(name);
    let blank: Text | undefined = undefined;

    let isTopTracker = false;
    if (attrGetters.tracker) {
        if (tracker) console.error("Nested tracker attributes are not supported. "
            + "Apply the tracker attribute at the top level of your application.");
        else {
            isTopTracker = true;
            tracker = attrGetters.tracker();
        }
    }

    for (let [name, attrGetter] of Object.entries(attrGetters ?? {})) {
        switch (name) {
            case "if":
                if (tracker) {
                    effect(tracker, () => {
                        if (attrGetter()) blank?.replaceWith(el);
                        else el.replaceWith(blank ??= document.createTextNode(""));
                    }, suppress);
                }
                else {
                    if (!attrGetter()) blank = document.createTextNode("");
                }
                break;
            case "style":
                if (tracker) {
                    effect(tracker, () => Object.assign(el.style, attrGetter()), suppress);
                }
                else {
                    Object.assign(el.style, attrGetter());
                }
                break;
            case "classList":
                if (tracker) {
                    effect(tracker, () => {
                        const classMap = attrGetter() as Record<string, boolean>;
                        for (const e of Object.entries(classMap)) el.classList.toggle(...e);
                    }, suppress);
                }
                else {
                    const classMap = attrGetter() as Record<string, boolean>;
                    for (const e of Object.entries(classMap)) el.classList.toggle(...e);
                }
                break;
            default:
                if (tracker) {
                    effect(tracker, () => (el as any)[name] = attrGetter(), suppress);
                }
                else {
                    (el as any)[name] = attrGetter();                
                }
                break;
        }
    }
    el.append(...children);

    if (isTopTracker) tracker = undefined;

    return blank ?? el;
}

export function child(getter: () => number | string | bigint | null | undefined | HTMLElement | Text): ChildNode {
    const result = getter();
    if (result instanceof HTMLElement) return result;
    if (result instanceof Text) return result;
    
    if (tracker) {
        let node = document.createTextNode("");
        effect(tracker, () => {
            const newNode = document.createTextNode(String(getter() ?? ""));
            node.replaceWith(newNode);
            node = newNode;
        }, suppress);
        return node;
    }
    else {
        return document.createTextNode(String(getter() ?? ""));
    }
}
