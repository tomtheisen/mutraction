import { effect } from "./effect.js"
import { defaultTracker } from "./tracker.js";
import { DependencyList } from "./dependency.js";
import { PropReference } from "./propref.js";
import { NodeModifier } from "./types.js";

const suppress = { suppressUntrackedWarning: true };
function effectDefault(sideEffect: (dep: DependencyList) => (void | (() => void))) {
    effect(sideEffect, suppress);
}

type ElementStringProps<E extends keyof HTMLElementTagNameMap> = {
    [K in keyof HTMLElementTagNameMap[E]]: HTMLElementTagNameMap[E][K] extends string ? string : never;
};
type ElementPropGetters<E extends keyof HTMLElementTagNameMap> = {
    [K in keyof HTMLElementTagNameMap[E]]: () => HTMLElementTagNameMap[E][K];
};

function isNodeModifier(obj: unknown): obj is NodeModifier {
    return obj != null && typeof obj === "object" && "$muType" in obj && typeof obj.$muType === "string"; 
}

function doApply(el: HTMLElement, mod: unknown) {
    if (Array.isArray(mod)) {
        mod.forEach(mod => doApply(el, mod));
        return;
    }

    if (!isNodeModifier(mod))
        throw Error("Expected a node modifier for 'mu:apply', but got " + typeof mod);

    switch (mod.$muType) {
        case "attribute":
            el.setAttribute(mod.name, mod.value);
            break;
            
        default:
            throw Error("Unknown node modifier type: " + mod.$muType);
    }
}

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

            case "mu:apply":
                doApply(el, value);
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
    
    let node = document.createTextNode("");
    effectDefault(() => {
        const newNode = document.createTextNode(String(getter() ?? ""));
        node.replaceWith(newNode);
        node = newNode;
    });
    return node;
}
