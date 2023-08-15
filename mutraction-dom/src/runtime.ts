import { effect, Tracker } from 'mutraction';
import { ElementSpan } from './ElementSpan.js';

let tracker: Tracker | undefined = undefined;

export function setTracker(newTracker: Tracker) {
    if (tracker)
        throw Error("Nested dom tracking is not supported. "
            + "Apply the tracker attribute at the top level of your application.");
    tracker = newTracker;
}

export function clearTracker() {
    if (!tracker)
        throw Error("No tracker to clear");
    tracker = undefined;
}

export function ForEach<Model>(array: Model[], map: (e: Model) => Node): Node {
    const result = document.createDocumentFragment();

    for (let i = 0; i < array.length; i++) {
        const container = new ElementSpan();
        result.append(container.getFragment());

        if (tracker) {
            effect(tracker, () => {
                container.replaceWith(map(array[i]));
            });
        }
        else {
            container.replaceWith(map(array[i]));
        }
    }

    return result;
}

type AttributeType<E extends keyof HTMLElementTagNameMap, K extends keyof HTMLElementTagNameMap[E]> = 
    K extends "style" ? Partial<CSSStyleDeclaration> :
    K extends "classList" ? Record<string, boolean> :
    HTMLElementTagNameMap[E][K];

// the jsx transformer wraps all the attributes in thunks
type StandardAttributes = {
    if?: () => boolean;
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

    for (let [name, attrGetter] of Object.entries(attrGetters ?? {})) {
        switch (name) {
            case "mu:if":
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

    return blank ?? el;
}

export function child(getter: () => number | string | bigint | null | undefined | HTMLElement | Text): ChildNode {
    const result = getter();
    if (result instanceof Node) return result;
    
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


document.createDocumentFragment().child