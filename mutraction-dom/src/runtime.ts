import { effect, Tracker } from 'mutraction';

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

export function ForEach<Model, Output extends Node>(array: Model[], map: (e: Model) => Output): Node {
    const result = document.createDocumentFragment();
    const startMarker = document.createTextNode(""), endMarker = document.createTextNode("");
    result.append(startMarker);

    startMarker.parentNode?.childNodes.entries

    const dep = tracker?.startDependencyTrack();
    const outputMap = dep ? new WeakMap<object, Node>() : undefined;
    // TODO once reconcile is working i think there's no need for this
    for (const e of array) {
        const node = map(e);
        if (e && typeof e === "object") outputMap?.set(e, node);
        result.append(node);
    }
    dep?.endDependencyTrack();

    result.append(endMarker);

    if (tracker) {
        effect(tracker, () => {
            // reconcile TODO
            const parent = startMarker.parentNode;
            for (let i = 0, c = startMarker.nextSibling; i < array.length; i++, c = c && c.nextSibling) {
                if (!c)
                    throw Error("ForEach: end marker has gotten lost following start marker");

                const e = array[i];
                if (typeof e === "object") {
                    outputMap.get(e); //wtf am i doinng
                }
            }
        });
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
