import { getActiveEffectCount } from "./effect.js";
import { PropReference, allPropRefs } from "./propref.js";
import { getAccessPath } from "./proxy.js";
import { getNodeDependencies } from "./runtime.js";
import { defaultTracker } from "./tracker.js";

const debugModeKey = "mu:debugMode";
const debugPullInterval = 250;

/*
 * Debug mode has several effects.  It must be turned on at page load time using this command.
 *
 * window[Symbol.for('mutraction.debug')]()
 */

export const isDebugMode = !!sessionStorage.getItem(debugModeKey);

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

function valueString(val: unknown): string {
    if (Array.isArray(val)) return `Array(${ val.length })`;
    if (typeof val === "object") return "{ ... }";
    return JSON.stringify(val);
}

function getPropRefListItem(propRef: PropReference) {
    const objPath = getAccessPath(propRef.object);
    const fullPath = objPath ? objPath + "." + String(propRef.prop) : String(propRef.prop);
    const value = valueString(propRef.current);
    const subCount = propRef.subscribers.size;
    const subCountMessage = `(${ subCount } ${ subCount === 1 ? "subscriber" : "subscribers" })`;
    const li = el("li", {}, el("code", {}, fullPath), ": ", value, " ", subCountMessage);
    return li;
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

if (isDebugMode) {
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

    const effectCount = el("span", {}, "0");
    const effectSummary = el("p", {}, el("p", {}, el("strong", {}, "Active effects: "), effectCount));
    setInterval(() => {
        effectCount.innerText = String(getActiveEffectCount());
    }, debugPullInterval);

    const undoButton = el("button", {}, "Undo");
    const redoButton = el("button", {}, "Redo");
    const historySummary = el("p", {}, 
        el("strong", {}, "History: "), 
        undoButton,
        redoButton
    );
    undoButton.addEventListener("click", () => defaultTracker.undo());
    redoButton.addEventListener("click", () => defaultTracker.redo());
    
    const propRefCountNumber = el("span", {}, "0");

    function refreshPropRefList() {
        const propRefListItems = [];
        for (const propRef of allPropRefs!) {
            propRefListItems.push(getPropRefListItem(propRef));
        }
        propRefList.replaceChildren(...propRefListItems);
    }

    const propRefRefreshButton = el("button", {}, "↻");
    propRefRefreshButton.addEventListener("click", refreshPropRefList);
    const propRefCount = el("div", {}, el("strong", {}, "Live PropRefs: "), propRefCountNumber, " ", propRefRefreshButton);
    const propRefList = el("ol", {});

    let seenGeneration = -1;
    setInterval(() => {
         if (allPropRefs!.generation !== seenGeneration) {
            propRefCountNumber.replaceChildren(String(allPropRefs!.sizeBound));
            refreshPropRefList();
            seenGeneration = allPropRefs!.generation;
        }
    }, debugPullInterval);

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
        effectSummary,
        historySummary,
        propRefCount, propRefList, 
        inspectButton, " ", el("strong", {}, "Inspected node:"), " ", inspectedName, inspectedPropList);

    container.append(head, content);

    document.body.append(container);

    let xOffset = 0, yOffset = 0;
    head.addEventListener("mousedown", ev => {
        const rect = container.getBoundingClientRect();
        xOffset = ev.x - rect.x;
        yOffset = ev.y - rect.y;

        window.addEventListener("mousemove", moveHandler);

        document.body.addEventListener("mouseup", ev => {
            window.removeEventListener("mousemove", moveHandler);
        }, { once: true });
        ev.preventDefault();

        function moveHandler(ev: MouseEvent) {
            container.style.left = ev.x - xOffset + "px";
            container.style.top = ev.y - yOffset + "px";
        }
    });
}
