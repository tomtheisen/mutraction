import { effect } from "./effect.js"
import { defaultTracker } from "./tracker.js";
import { DependencyList } from "./dependency.js";
import { PropReference } from "./propref.js";
import { NodeModifier, Subscription } from "./types.js";
import { registerCleanup } from "./cleanup.js";

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

export function element<E extends keyof HTMLElementTagNameMap>(
    name: E, 
    staticAttrs: ElementStringProps<E>,
    dynamicAttrs: ElementPropGetters<E>,
    ...children: (Node | string)[]
): HTMLElementTagNameMap[E] | Text {
    const el: HTMLElementTagNameMap[E] = document.createElement(name);
    el.append(...children);

    let syncEvents: string | undefined;
    let diagnosticApplied = false;
    for (let [name, value] of Object.entries(staticAttrs) as [string, string][]) {
        switch (name) {
            case "mu:syncEvent":
                syncEvents = value;
                break;

            case "mu:apply":
                doApply(el, value);
                break;

            case "mu:diagnostic":
                diagnosticApplied = true;
                break;

            default:
                (el as any)[name] = value;                
                break;
        }
    }

    if (diagnosticApplied) {
        console.trace(`[mu:diagnostic] Creating ${ name }`);
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
            case "style": {
                const callback = !diagnosticApplied
                    ? function updateStyle() { Object.assign(el.style, getter()); }
                    : function updateStyleDiagnostic() {
                        console.trace("[mu:diagnostic] Updating style");
                        Object.assign(el.style, getter());
                    };
                const sub = effect(callback, suppress);
                registerCleanup(el, sub);
                break;
            }

            case "classList": {
                const callback = !diagnosticApplied
                    ? function updateClassList() { 
                        const classMap = getter() as Record<string, boolean>;
                        for (const [name, on] of Object.entries(classMap)) el.classList.toggle(name, !!on);
                    }
                    : function updateClassListDiagnostic() { 
                        console.trace("[mu:diagnostic] Updating classList");
                        const classMap = getter() as Record<string, boolean>;
                        for (const [name, on] of Object.entries(classMap)) el.classList.toggle(name, !!on);
                    };
                const sub = effect(callback, suppress);
                registerCleanup(el, sub);
                break;
            }

            default: {
                const callback = !diagnosticApplied
                    ? function updateAttribute() { (el as any)[name] = getter(); }
                    : function updateAttributeDiagnostic() {
                        console.trace(`[mu:diagnostic] Updating ${ name }`);
                        (el as any)[name] = getter();
                    };
                const sub = effect(callback, suppress);
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
    sub = effect(dl => {
        const val = getter();
        if (val instanceof Node) {
            // this effect is now dead
            // since we don't replace nodes by default
            dl.untrackAll(); // TODO could still be trackAllProperties
            node = val;
        }
        else {
            const newNode = document.createTextNode(String(val ?? ""));
            if (sub) registerCleanup(newNode, sub);
            node.replaceWith(newNode);
            node = newNode;
        }
    }, suppress);
    registerCleanup(node, sub);
    return node;
}
