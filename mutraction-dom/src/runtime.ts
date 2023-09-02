import { effect } from "./effect.js"
import { getMarker } from './getMarker.js';
import { ElementSpan } from './elementSpan.js';
import { defaultTracker } from "./tracker.js";
import { DependencyList } from "./dependency.js";
import { PropReference } from "./propref.js";

const suppress = { suppressUntrackedWarning: true };
function effectDefault(sideEffect: (dep: DependencyList) => (void | (() => void))) {
    effect(sideEffect, suppress);
}

/**
 * Generates DOM nodes for an array of values.  The resulting nodes track the array indices.
 * Re-ordering the array will cause affected nodes to be re-generated.
 * @see ForEachPersist if you want DOM nodes to follow the array elements through order changes
 * @param array is the input array
 * @param map is the callback function to produce DOM nodes
 * @returns a DOM node you can include in a document
 */
export function ForEach<TIn, TOut extends Node>(array: TIn[], map: (item: TIn, index: number, array: TIn[]) => TOut): Node {
    const result = new ElementSpan();
    const containers: ElementSpan[] = [];

    effectDefault(lengthDep => {
        // i is scoped to each loop body invocation
        for (let i = containers.length; i < array.length; i++) {
            const container = new ElementSpan();
            containers.push(container);

            effectDefault(itemDep => {
                const item = array[i];
                // in operations like .splice() elements are removed prior to updating length
                // so this code needs to be null-tolerant even though the type system says otherwise.
                const newNode = item !== undefined ? map(item, i, array) : getMarker("ForEach undefined placeholder");
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

/**
 * Generates DOM nes for an array of objects.  The resulting nodes track the array elements.
 * Re-ordering the array will cause the generated nodes to re-ordered in parallel
 * @param array is the input array of objects.  Primitive values can't be used.
 * @param map is the callback function to produce DOM nodes
 * @returns a DOM node you can include in a document
 */
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
    el.append(...children);

    let syncEvents: string | undefined;
    for (let [name, value] of Object.entries(staticAttrs) as [string, string][]) {
        switch (name) {
            case "mu:syncEvent":
                syncEvents = value;
                break;

            default:
                (el as any)[name] = value;                
                break;
        }
    }

    const syncedProps = syncEvents ? [] as [prop: keyof typeof el, ref: PropReference][] : undefined;
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

    if (syncEvents && syncedProps?.length) {
        for (const e of syncEvents.matchAll(/\S+/g)) {
            el.addEventListener(e[0], () => {
                for (const [name, propRef] of syncedProps) propRef.current = el[name];
            });
        }
    }

    return el;
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
