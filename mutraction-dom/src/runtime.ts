import { effect, Tracker, DependencyList } from 'mutraction';
import { getMarker } from './getMarker.js';
import { ElementSpan } from './ElementSpan.js';

let trackers: Tracker[] = [];

export function setTracker(newTracker: Tracker) {
    if (trackers.length)
        throw Error("Nested dom tracking is not supported. "
            + "Apply the tracker attribute at the top level of your application.");
    trackers.unshift(newTracker);
}

export function clearTracker() {
    if (trackers.length === 0)
        throw Error("No tracker to clear");
    if (trackers.length > 1)
        throw Error("Internal error: too many trackers");
    trackers.unshift();
}

function effectOrDo(sideEffect: (dep?: DependencyList) => (void | (() => void))) {
    const originalTracker = trackers[0];
    if (originalTracker) {
        function scopedEffect(dep: DependencyList) {
            trackers.unshift(originalTracker);
            sideEffect(dep);
            trackers.shift();
        }
        effect(originalTracker, scopedEffect, { suppressUntrackedWarning: true });
    }
    else {
        sideEffect();
    }
}

export function ForEach<TIn, TOut extends Node>(array: TIn[], map: (e: TIn) => TOut): Node {
    const result = new ElementSpan();
    const containers: ElementSpan[] = [];

    effectOrDo(lengthDep => {
        // i is scoped to each loop body invocation
        for (let i = containers.length; i < array.length; i++) {
            const container = new ElementSpan();
            containers.push(container);

            effectOrDo(itemDep => {
                const newNode = map(array[i]);
                container.replaceWith(newNode);
            });

            result.append(container.removeAsFragment());
        }

        while (containers.length > array.length) {
            containers.pop()!.removeAsFragment();
        }
    });

    return result.removeAsFragment();
}

export function ForEachPersist<TIn extends object>(array: TIn[], map: (e: TIn) => Node): Node {
    const capturedTracker = trackers;
    const result = new ElementSpan();
    const containers: ElementSpan[] = [];
    const outputMap = new WeakMap<TIn, HTMLElement | ElementSpan>;

    effectOrDo(() => {
        const originalTracker = trackers;
        trackers = capturedTracker;

        // i is scoped to each loop body invocation
        for (let i = containers.length; i < array.length; i++) {
            const container = new ElementSpan();
            containers.push(container);

            effectOrDo((dep) => {
                const originalTracker = trackers;
                trackers = capturedTracker;

                // this is wild - just keep the contents together with a parent somewhere
                container.emptyAsFragment();

                const item = array[i];
                if (item == null) return; // probably an array key deletion

                if (typeof item !== "object") throw Error("Elements must be object in ForEachPersist");
                
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

                trackers = originalTracker;
            });

            result.append(container.removeAsFragment());
        }

        while (containers.length > array.length) {
            containers.pop()!.removeAsFragment();
        }

        trackers = originalTracker;
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
                if (!value) return getMarker("optimized out");
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
        const tracker = trackers[0];
        if (!tracker) throw Error("Cannot apply dynamic properties without scoped tracker");

        switch (name) {
            case "mu:if":
                effectOrDo(() => {
                    if (getter()) blank?.replaceWith(el);
                    else el.replaceWith(blank ??= getMarker("blank"));
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
    const tracker = trackers[0];
    
    if (tracker) {
        let node = getMarker("placeholder");
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
