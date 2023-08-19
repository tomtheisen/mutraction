import { effect } from "./effect.js"
import { getMarker } from './getMarker.js';
import { ElementSpan } from './elementSpan.js';
import { defaultTracker } from "./tracker.js";
import { DependencyList } from "./dependency.js";

const suppress = { suppressUntrackedWarning: true };
function effectDefault(sideEffect: (dep: DependencyList) => (void | (() => void))) {
    effect(defaultTracker, sideEffect, suppress);
}

export function ForEach<TIn, TOut extends Node>(array: TIn[], map: (e: TIn) => TOut): Node {
    const result = new ElementSpan();
    const containers: ElementSpan[] = [];

    effectDefault(lengthDep => {
        // i is scoped to each loop body invocation
        for (let i = containers.length; i < array.length; i++) {
            const container = new ElementSpan();
            containers.push(container);

            effectDefault(itemDep => {
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
    const result = new ElementSpan();
    const containers: ElementSpan[] = [];
    const outputMap = new WeakMap<TIn, HTMLElement | ElementSpan>;

    effectDefault(() => {
        // i is scoped to each loop body invocation
        for (let i = containers.length; i < array.length; i++) {
            const container = new ElementSpan();
            containers.push(container);

            effectDefault((dep) => {
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
            });

            result.append(container.removeAsFragment());
        }

        while (containers.length > array.length) {
            containers.pop()!.removeAsFragment();
        }
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
        switch (name) {
            case "style":
                effectDefault(() => { Object.assign(el.style, getter()); });
                break;

            case "classList":
                effectDefault(() => { 
                    const classMap = getter() as Record<string, boolean>;
                    for (const e of Object.entries(classMap)) el.classList.toggle(...e);
                });
                break;

            default:
                effectDefault(() => { (el as any)[name] = getter(); });
                break;
        }
    }

    el.append(...children);

    return blank ?? el;
}

export function child(getter: () => number | string | bigint | null | undefined | HTMLElement | Text): ChildNode {
    const result = getter();
    if (result instanceof Node) return result;
    
    let node = getMarker("placeholder");
    effectDefault(() => {
        const newNode = document.createTextNode(String(getter() ?? ""));
        node.replaceWith(newNode);
        node = newNode;
    });
    return node;
}
