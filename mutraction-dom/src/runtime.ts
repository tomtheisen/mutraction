import { effect } from "./effect.js"
import { defaultTracker } from "./tracker.js";
import { DependencyList } from "./dependency.js";
import { PropReference } from "./propref.js";
import { NodeModifier, Subscription } from "./types.js";
import { registerCleanup } from "./cleanup.js";
import { isDebugMode } from "./debug.js";

const suppress = { suppressUntrackedWarning: true };

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

const nodeDependencyMap = new WeakMap<ChildNode, DependencyList[]>;
function addNodeDependency(node: ChildNode, depList: DependencyList) {
    if (depList.trackedProperties.length === 0) return;
    let depLists = nodeDependencyMap.get(node);
    if (!depLists) nodeDependencyMap.set(node, depLists = []);
    depLists.push(depList);
}

export function getNodeDependencies(node: ChildNode) : DependencyList[] | undefined {
    return nodeDependencyMap.get(node);
}

const propRedirects: Record<string, string> = {
    class: "className"
};

export function element<E extends keyof HTMLElementTagNameMap>(
    tagName: E, 
    staticAttrs: ElementStringProps<E>,
    dynamicAttrs: ElementPropGetters<E>,
    ...children: (Node | string)[]
): HTMLElementTagNameMap[E] | Text {
    const el: HTMLElementTagNameMap[E] = document.createElement(tagName);
    el.append(...children);

    let syncEvents: string | undefined;

    for (let [name, value] of Object.entries(staticAttrs) as [string, string][]) {
        name = propRedirects[name] ?? name;
        
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
        name = propRedirects[name] ?? name;

        if (syncedProps && name in el) {
            const propRef = defaultTracker.getPropRefTolerant(getter);
            if (propRef) {
                syncedProps.push([name as any, propRef]);
            }
        }

        switch (name) {
            case "style": {
                function updateStyle(dl: DependencyList) { 
                    Object.assign(el.style, getter());
                    if (isDebugMode) addNodeDependency(el, dl);
                }
                const sub = effect(updateStyle, suppress);
                registerCleanup(el, sub);
                break;
            }

            case "classList": {
                function updateClassList(dl: DependencyList) { 
                    const classMap = getter() as Record<string, boolean>;
                    for (const [name, on] of Object.entries(classMap)) el.classList.toggle(name, !!on);
                    if (isDebugMode) addNodeDependency(el, dl);
                }
                const sub = effect(updateClassList, suppress);
                registerCleanup(el, sub);
                break;
            }

            default: {
                function updateAttribute(dl: DependencyList) { 
                    (el as any)[name] = getter();
                    if (isDebugMode) addNodeDependency(el, dl);
                }
                const sub = effect(updateAttribute, suppress);
                registerCleanup(el, sub);
                break;
            }
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
    let node: Text | HTMLElement = document.createTextNode("");
    let sub: Subscription | undefined = undefined;
    sub = effect(function childEffect(dl) {
        const val = getter();
        if (val instanceof Node) {
            // this effect is now dead
            // since we don't replace nodes by default
            dl.untrackAll(); // TODO could still be trackAllProperties in the case of a .history dependency
            node = val;
        }
        else {
            const newNode = document.createTextNode(String(val ?? ""));
            if (sub) registerCleanup(newNode, sub);
            node.replaceWith(newNode);
            node = newNode;
            if (isDebugMode) addNodeDependency(node, dl);
        }
    }, suppress);
    registerCleanup(node, sub);
    return node;
}
