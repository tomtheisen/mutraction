import { effect, Tracker, DependencyList } from 'mutraction';
import { getMarker } from './getMarker.js';
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

function effectOrDo(sideEffect: (dep?: DependencyList) => (void | (() => void))) {
    if (tracker) effect(tracker, sideEffect, { suppressUntrackedWarning: true });
    else sideEffect();
}

export function ForEach<TIn, TOut extends Node>(array: TIn[], map: (e: TIn) => TOut): Node {
    const capturedTracker = tracker;
    const result = new ElementSpan();
    const containers: ElementSpan[] = [];

    effectOrDo(() => {
        const originalTracker = tracker;
        tracker = capturedTracker;

        // i is scoped to each loop body invocation
        for (let i = containers.length; i < array.length; i++) {
            const container = new ElementSpan();
            containers.push(container);

            effectOrDo(() => {
                const originalTracker = tracker;
                tracker = capturedTracker;

                const newNode = map(array[i]);
                container.replaceWith(newNode);

                tracker = originalTracker;
            });

            result.append(container.removeAsFragment());
        }

        while (containers.length > array.length) {
            containers.pop()!.removeAsFragment();
        }

        tracker = originalTracker;
    });

    return result.removeAsFragment();
}

export function ForEachPersist<TIn extends object>(array: TIn[], map: (e: TIn) => Node): Node {
    const capturedTracker = tracker;
    const result = new ElementSpan();
    const containers: ElementSpan[] = [];
    const outputMap = new WeakMap<TIn, HTMLElement | ElementSpan>;

    effectOrDo(() => {
        const originalTracker = tracker;
        tracker = capturedTracker;

        // i is scoped to each loop body invocation
        for (let i = containers.length; i < array.length; i++) {
            const container = new ElementSpan();
            containers.push(container);

            effectOrDo((dep) => {
                const originalTracker = tracker;
                tracker = capturedTracker;

                const item = array[i];
                if (typeof item !== "object" || item == null)
                    throw Error("Elements must be object in ForEachPersist");
                let newContents = outputMap.get(item);
                if (newContents == null) {
                    if (dep) dep.active = false;
                    let newNode = map(item);
                    newContents = newNode instanceof HTMLElement ? newNode : new ElementSpan(newNode);
                    outputMap.set(item, newContents);
                    if (dep) dep.active = true;
                }

                if (newContents instanceof HTMLElement) {
                    container.replaceWith(newContents);
                }
                else {
                    container.replaceWith(newContents.removeAsFragment());
                }

                tracker = originalTracker;
            });

            result.append(container.removeAsFragment());
        }

        while (containers.length > array.length) {
            containers.pop()!.removeAsFragment();
        }

        tracker = originalTracker;
    });

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
                if (!value) return getMarker();
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
                effectOrDo(() => {
                    if (getter()) blank?.replaceWith(el);
                    else el.replaceWith(blank ??= getMarker());
                });
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
        let node = getMarker();
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
