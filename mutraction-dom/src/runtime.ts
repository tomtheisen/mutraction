import { effect, track, Tracker } from 'mutraction';
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

export function ForEach<TIn, TOut extends Node>(array: TIn[], map: (e: TIn) => TOut): Node {
    const _tracker = tracker;
    const result = new ElementSpan();
    const containers: ElementSpan[] = [];

    effectOrDo(() => {
        // i is scoped to each loop body invocation
        for (let i = containers.length; i < array.length; i++) {
            const container = new ElementSpan();
            containers.push(container);

            effectOrDo(() => {
                const newNode = map(array[i]);
                container.replaceWith(newNode);
            }, _tracker);

            result.append(container.removeAsFragment());
        }

        while (containers.length > array.length) {
            containers.pop()!.removeAsFragment();
        }
    }, _tracker);

    return result.removeAsFragment();
}

export function ForEachPersist<TIn extends object, TOut extends Node>(array: TIn[], map: (e: TIn) => TOut): Node {
    const _tracker = tracker;
    const result = new ElementSpan();
    const containers: ElementSpan[] = [];
    const outputMap = new WeakMap<TIn, TOut>;

    effectOrDo(() => {
        // i is scoped to each loop body invocation
        for (let i = containers.length; i < array.length; i++) {
            const container = new ElementSpan();
            containers.push(container);

            effectOrDo(() => {
                const item = array[i];
                if (typeof item !== "object" || item == null)
                    throw Error("Elements must be object in ForEachPersist");
                let newNode = outputMap.get(item);
                if (newNode == null) {
                    outputMap.set(item, newNode = map(item));
                }
                container.replaceWith(newNode);
            }, _tracker);

            result.append(container.removeAsFragment());
        }

        while (containers.length > array.length) {
            containers.pop()!.removeAsFragment();
        }
    }, _tracker);

    return result.removeAsFragment();
}

type AttributeType<E extends keyof HTMLElementTagNameMap, K extends keyof HTMLElementTagNameMap[E]> = 
    K extends "style" ? Partial<CSSStyleDeclaration> :
    K extends "classList" ? Record<string, boolean> :
    HTMLElementTagNameMap[E][K];

// the jsx transformer wraps all the attributes in thunks
type StandardAttributes = {
    if?: boolean;
};
type ElementProps<E extends keyof HTMLElementTagNameMap> = {
    [K in keyof HTMLElementTagNameMap[E]]?: AttributeType<E, K>;
} & StandardAttributes;

type ElementPropGetters<E extends keyof HTMLElementTagNameMap> = {
    [K in keyof ElementProps<E>]: () => ElementProps<E>[K];
}

export function element<E extends keyof HTMLElementTagNameMap>(
    name: E, 
    staticAttrs: ElementProps<E>,
    dynamicAttrs: ElementPropGetters<E>,
    ...children: (Node | string)[]
): HTMLElementTagNameMap[E] | Text {
    const el = document.createElement(name);

    for (let [name, value] of Object.entries(staticAttrs ?? {})) {
        switch (name) {
            case "mu:if":
                if (!value) return document.createTextNode("");
                break;

            case "style":
                Object.assign(el.style, value);
                break;

            case "classList":
                const classMap = value as Record<string, boolean>;
                for (const e of Object.entries(classMap)) el.classList.toggle(...e);
                break;

            default:
                (el as any)[name] = value;                
                break;
        }
    }

    let blank: Text | undefined = undefined; // for mu:if
    for (let [name, getter] of Object.entries(dynamicAttrs ?? {})) {
        if (!tracker) throw Error("Cannot apply dynamic properties without scoped tracker");

        switch (name) {
            case "mu:if":
                effect(tracker, () => {
                    if (getter()) blank?.replaceWith(el);
                    else el.replaceWith(blank ??= document.createTextNode(""));
                }, { suppressUntrackedWarning: true });
            

                break;

            case "style":
                effect(tracker, () => { 
                    Object.assign(el.style, getter());
                }, { suppressUntrackedWarning: true });
                break;

            case "classList":
                effect(tracker, () => { 
                    const classMap = getter() as Record<string, boolean>;
                    for (const e of Object.entries(classMap)) el.classList.toggle(...e);
                }, { suppressUntrackedWarning: true });
                break;

            default:
                effect(tracker, () => { 
                    (el as any)[name] = getter();                
                }, { suppressUntrackedWarning: true });
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
