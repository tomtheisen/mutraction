import { effect } from "./effect.js"
import { getMarker } from './getMarker.js';
import { ElementSpan } from './elementSpan.js';
import { defaultTracker } from "./tracker.js";
import { DependencyList } from "./dependency.js";
import { PropReference } from "./propref.js";

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

type ElementStringProps<E extends keyof HTMLElementTagNameMap> = {
    [K in keyof HTMLElementTagNameMap[E]]: HTMLElementTagNameMap[E][K] extends string ? string : never;
};
type ElementPropGetters<E extends keyof HTMLElementTagNameMap> = {
    [K in keyof HTMLElementTagNameMap[E]]: () => HTMLElementTagNameMap[E][K];
};

export function element<E extends keyof HTMLElementTagNameMap>(
    name: E, 
    staticAttrs: ElementStringProps<E>,
    dynamicAttrs: ElementPropGetters<E>,
    ...children: (Node | string)[]
): HTMLElementTagNameMap[E] | Text {
    const el: HTMLElementTagNameMap[E] = document.createElement(name);

    let syncEvent: string | undefined;
    for (let [name, value] of Object.entries(staticAttrs) as [string, string][]) {
        switch (name) {
            case "mu:syncEvent":
                syncEvent = value;
                break;

            default:
                (el as any)[name] = value;                
                break;
        }
    }

    const syncedProps = syncEvent ? [] as [prop: keyof typeof el, ref: PropReference][] : undefined;

    // TODO i don't think this is used anymore
    let blank: Text | undefined = undefined; // for mu:if

    for (let [name, getter] of Object.entries(dynamicAttrs)) {
        if (syncedProps && name in el) {
            const propRef = defaultTracker.getPropRefTolerant(getter);
            if (propRef) {
                syncedProps.push([name as any, propRef]);
            }
        }

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

    if (syncEvent && syncedProps?.length) {
        el.addEventListener(syncEvent, ev => {
            for (const [name, propRef] of syncedProps) {
                propRef.current = el[name];
            }
        });
    }

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
