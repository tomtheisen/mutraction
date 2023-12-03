import { effect, getActiveEffects } from "./effect.js";
import { PropReference, getAllPropRefs } from "./propref.js";
import { getAccessPath } from "./proxy.js";
import { getNodeDependencies } from "./runtime.js";
import { defaultTracker } from "./tracker.js";
import { Mutation } from "./types.js";

const debugModeKey = "mu:debugMode";
const debugUpdateDebounce = 250;
const historyDepth = 10;

export const isDebugMode = ("sessionStorage" in globalThis) && !!sessionStorage.getItem(debugModeKey);

if ("sessionStorage" in globalThis) {
    function enableDebugMode() {
        sessionStorage.setItem(debugModeKey, "true");
        location.reload();
    }

    Object.assign(window, { [Symbol.for("mutraction.debug")]: enableDebugMode });
    if (["localhost", "127.0.0.1", "[::1]"].includes(location.hostname) && !isDebugMode) {
        console.info(`[µ] Try the mutraction diagnostic tool.  This message is only shown from localhost, but the tool is always available.`);
        console.info("» window[Symbol.for('mutraction.debug')]()");
    }

    function disableDebugMode() {
        sessionStorage.removeItem(debugModeKey);
        location.reload();
    }

    if (isDebugMode) {
        const updateCallbacks: (() => void)[] = [];

        let handle = 0;
        queueMicrotask(() => {
            effect(function historyChanged(dl) {
                dl.trackAllChanges();

                if (handle === 0) {
                    handle = setTimeout(function updateDiagnostics() {
                        for (const cb of updateCallbacks) cb();
                        handle = 0;
                    }, debugUpdateDebounce);
                }
            });
        });

        function valueString(val: unknown): string {
            if (Array.isArray(val)) return `Array(${ val.length })`;
            if (typeof val === "object") return "{ ... }";
            if (typeof val === "function") return val.name ? `${ val.name }() { ... }` : "() => { ... }";
            return JSON.stringify(val);
        }
    
        function el<K extends keyof HTMLElementTagNameMap>(tag: K, styles: Partial<CSSStyleDeclaration>, ...nodes: (string | Node)[]): HTMLElementTagNameMap[K];
        function el(tag: string, styles: Partial<CSSStyleDeclaration>, ...nodes: (string | Node)[]): HTMLElement {
            const node = document.createElement(tag);
            node.style.all = "revert";
            Object.assign(node.style, styles);
            node.append(...nodes);
            return node;
        }
    
        function getNodeAndTextDependencies(node: HTMLElement) {
            const textDeps = Array.from(node.childNodes)
                .filter(n => n instanceof Text)
                .flatMap(n => getNodeDependencies(n))
                .filter(Boolean)
                .map(n => n!);
            return (getNodeDependencies(node) ?? []).concat(...textDeps);
        }

        function getPropRefListItem(propRef: PropReference) {
            const objPath = getAccessPath(propRef.object);
            const fullPath = objPath ? objPath + "." + String(propRef.prop) : String(propRef.prop);
            const value = propRef.current;
            const serialized = valueString(value);
            const editable = !value || typeof value !== "object" && typeof value !== "function";
            const valueSpan = el("span", editable ? {cursor: "pointer", textDecoration: "underline"} : {}, serialized);
            const subCount = propRef.subscribers.size;
            const subCountMessage = `(${ subCount } ${ subCount === 1 ? "subscriber" : "subscribers" })`;
            const li = el("li", {}, el("code", {}, fullPath), ": ", valueSpan, " ", subCountMessage);
        
            if (editable) valueSpan.addEventListener("click", () => {
                const result = prompt(`Update ${ String(propRef.prop) }`, serialized);
                try {
                    if (result) propRef.current = JSON.parse(result);
                    refreshPropRefList();
                }
                catch {}
            });
        
            return li;
        }

        const container = el("div", 
            {
                position: "fixed", 
                top: "50px", 
                left: "50px", 
                width: "30em", 
                height: "20em", 
                resize: "both", 
                minHeight: "1.6em",
                minWidth: "15em",
                zIndex: "2147483647", 
                background: "#eee", 
                color: "#123", 
                boxShadow: "#000 0em 0.5em 1em", 
                border: "solid #345 0.4em", 
                fontSize: "16px", 
                display: "flex", 
                flexDirection: "column", 
                overflow: "auto", 
            }
        );

        const toggle = el("button", { marginRight: "1em" }, "_");

        let minimized = false;
        toggle.addEventListener("click", ev => {
            if (minimized = !minimized) {
                container.style.maxHeight = "1.6em";
                container.style.maxWidth = "15em";
            }
            else {
                container.style.maxHeight = "";
                container.style.maxWidth = "";
            }
            clampIntoView();
        });

        const closeButton = el("button", { float: "right" }, "×");
        closeButton.addEventListener("click", disableDebugMode);
        const head = el("div", 
            {
                fontWeight: "bold",
                background: "#123",
                color: "#eee",
                padding: "0.1em 1em",
                cursor: "grab",
            },
            closeButton, toggle, "μ diagnostics");

        const effectDetails = el("div", { whiteSpace: "pre" });
        const effectCount = el("span", {}, "0");
        const effectSummary = el("details", { cursor: "pointer", marginBottom: "1em" }, 
            el("summary", {}, el("strong", {}, "Active effects: "), effectCount),
            effectDetails
        );
        let activeEffectsGeneration = -1;
        updateCallbacks.push(() => {
            let { activeEffects, generation } = getActiveEffects();
            if (generation !== activeEffectsGeneration) {
                activeEffectsGeneration = generation;
                effectDetails.innerText = [...activeEffects.entries()].map(e => `${e[0]}×${e[1]}`).join("\n");
                effectCount.innerText = String(Array.from(activeEffects.values()).reduce((a, b) => a + b, 0));
            }
        });

        const propRefCountNumber = el("span", {}, "0");

        const allPropRefs = getAllPropRefs();
        function refreshPropRefList() {
            const propRefListItems = [];
            for (const propRef of allPropRefs) {
                propRefListItems.push(getPropRefListItem(propRef));
            }
            propRefList.replaceChildren(...propRefListItems);
        }

        const propRefRefreshButton = el("button", {}, "↻");
        propRefRefreshButton.addEventListener("click", refreshPropRefList);
        const propRefList = el("ol", {});
        const propRefSummary = el("details", {},
            el("summary", { cursor: "pointer" }, 
                el("strong", {}, "Live PropRefs: "), propRefCountNumber, " ", propRefRefreshButton
            ),
            propRefList
        )

        let seenGeneration = -1;
        updateCallbacks.push(() => {
            if (allPropRefs!.generation !== seenGeneration) {
                propRefCountNumber.replaceChildren(String(allPropRefs!.sizeBound));
                refreshPropRefList();
                seenGeneration = allPropRefs!.generation;
            }
        });

        function startInspectPick() {
            inspectButton.disabled = true;
            inspectButton.textContent = "…";
            inspectedName.textContent = "(choose)";

            let inspectedElement: HTMLElement | undefined | null;
            let originalBoxShadow = "";

            function moveHandler(ev: MouseEvent) {
                if (ev.target instanceof HTMLElement) {
                    let target: HTMLElement | null = ev.target;
                    while (target && (getNodeAndTextDependencies(target)?.length ?? 0) === 0) {
                        target = target.parentElement;
                    }

                    if (target != inspectedElement) {
                        if (inspectedElement) inspectedElement.style.boxShadow = originalBoxShadow;

                        originalBoxShadow = target?.style.boxShadow ?? "";
                        if (target) {
                            if (target.style.boxShadow) target.style.boxShadow += ", inset #f0f4 0 99vmax";
                            else target.style.boxShadow += "inset #f0f4 0 99vmax";
                        }
                        inspectedElement = target;
                    }
                }
                ev.stopPropagation();
            }

            document.addEventListener("mousemove", moveHandler, { capture: true });
            document.addEventListener("click", ev => {
                ev.stopPropagation();
                ev.preventDefault();

                inspectButton.disabled = false;
                inspectButton.textContent = "🔍";
                document.removeEventListener("mousemove", moveHandler, { capture: true });
                if (inspectedElement) {
                    inspectedElement.style.boxShadow = originalBoxShadow;
                    inspectedName.textContent = inspectedElement.tagName.toLowerCase();

                    const deps = getNodeAndTextDependencies(inspectedElement);
                    const trackedProps = new Set(deps.flatMap(d => d.trackedProperties));
                    const trackedPropItems: HTMLLIElement[] = [];
                    for (const propRef of trackedProps) {
                        trackedPropItems.push(getPropRefListItem(propRef));
                    }
                    inspectedPropList.replaceChildren(...trackedPropItems);
                } 
                else {
                    inspectedName.textContent = "(none)";
                    inspectedPropList.replaceChildren();
                }
            }, { capture: true, once: true });
        }

        const inspectButton = el("button", {}, "🔍");
        inspectButton.addEventListener("click", startInspectPick);
        const inspectedName = el("span", {}, "(none)");
        const inspectedPropList = el("ol", {});

        const content = el("div", {padding: "1em", overflow: "auto"}, 
            inspectButton, " ", el("strong", {}, "Inspected node:"), " ", inspectedName, inspectedPropList,
            effectSummary,
            propRefSummary);

        container.append(head, content);

        document.body.append(container);

        let xOffset = 0, yOffset = 0;
        head.addEventListener("mousedown", ev => {
            const rect = container.getBoundingClientRect();
            xOffset = ev.x - rect.x;
            yOffset = ev.y - rect.y;

            window.addEventListener("mousemove", moveHandler);

            document.body.addEventListener("mouseup", upHandler, { once: true });
            ev.preventDefault();

            function upHandler(ev: MouseEvent) {
                window.removeEventListener("mousemove", moveHandler);
            }

            function moveHandler(ev: MouseEvent) {
                const buttonPressed = (ev.buttons & 1) > 0;

                if (buttonPressed) {
                    container.style.left = ev.x - xOffset + "px";
                    container.style.top = ev.y - yOffset + "px";
                    clampIntoView();
                }
                else {
                    window.removeEventListener("mousemove", moveHandler);
                    window.removeEventListener("mouseup", upHandler);
                }
            }
        });

        function clampIntoView() {
            const { x, y, width, height } = container.getBoundingClientRect();
            const top = Math.max(0, Math.min(window.innerHeight - height, y));
            const left = Math.max(0, Math.min(window.innerWidth - width, x));
            container.style.top = top + "px";
            container.style.left = left + "px";
        }
        window.addEventListener("resize", clampIntoView);
    }
}

function describeMutation(mut: Readonly<Mutation>): string {
    switch (mut.type) {
        case "transaction":  return `Transaction ${ mut.transactionName }`;
        case "create":       return `Create property ${ String(mut.name) }: ${ mut.newValue }`;
        case "change":       return `Modify property ${ String(mut.name) }: ${ mut.newValue }`;
        case "delete":       return `Delete property ${ String(mut.name) }`;
        case "arrayextend":  return `Extend array to [${ mut.newIndex }] = ${ mut.newValue }`;
        case "arrayshorten": return `Shorten array to ${ mut.newLength}`;
        case "setadd":       return `Add to set: ${ mut.newValue }`;
        case "setdelete":    return `Delete from set: ${ mut.oldValue }`;
        case "setclear":     return `Clear set`;
        case "mapcreate":    return `Add new entry to map [${ mut.key }, ${ mut.newValue }]`;
        case "mapchange":    return `Change entry in map [${ mut.key }, ${ mut.newValue }]`;
        case "mapdelete":    return `Remove key from map ${ mut.key }`;
        case "mapclear":     return `Clear map`;

        default: mut satisfies never;
    }
    throw new Error("Function not implemented.");
}

