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

function effectOrDo(sideEffect: () => (void | (() => void)), t: Tracker | undefined = tracker) {
    if (t) effect(t, sideEffect, { suppressUntrackedWarning: true });
    else sideEffect();
}

export function ForEach<Model>(array: Model[], map: (e: Model) => Node): Node {
    const result = new ElementSpan();
    const containers: ElementSpan[] = [];
    const localTracker = tracker;

    effectOrDo(() => {
        for (let i = containers.length; i < array.length; i++) {
            const container = new ElementSpan();
            const locali = i;
            containers.push(container);

            effectOrDo(() => {
                container.replaceWith(map(array[locali]));
            }, localTracker);

            result.append(container.removeAsFragment());
        }

        while (containers.length > array.length) {
            containers.pop()!.removeAsFragment();
        }
    }, localTracker);

    return result.removeAsFragment();
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
                    }, { suppressUntrackedWarning: true });
                }
                else {
                    if (!attrGetter()) blank = document.createTextNode("");
                }
                break;

            case "style":
                effectOrDo(() => { 
                    Object.assign(el.style, attrGetter());
                });
                break;

            case "classList":
                effectOrDo(() => {
                    const classMap = attrGetter() as Record<string, boolean>;
                    for (const e of Object.entries(classMap)) el.classList.toggle(...e);
                });
                break;

            default:
                effectOrDo(() => {
                    (el as any)[name] = attrGetter();                
                });
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
        }, { suppressUntrackedWarning: true });
        return node;
    }
    else {
        return document.createTextNode(String(getter() ?? ""));
    }
}
