import { setPropRefDebugCallback } from "./propref.js";

const debugModeKey = "mu:debugMode";

/*
 * Debug mode has several effects.  It must be turned on at page load time.
 *
 *
 */

export const isDebugMode = !!localStorage.getItem(debugModeKey);

// TODO figure out a switch that doesn't suck
function enableDebugMode() {
    localStorage.setItem(debugModeKey, "true");
    location.reload();
}

function disableDebugMode() {
    localStorage.removeItem(debugModeKey);
    location.reload();
}

if (isDebugMode) {
    const container = document.createElement("div");
    {
        container.style.position = "fixed";
        container.style.top = "50px";
        container.style.left = "50px";
        container.style.width = "30em";
        container.style.height = "20em";
        container.style.resize = "both";
        container.style.zIndex = "2147483647";
        container.style.background = "#eee";
        container.style.color = "#123";
        container.style.boxShadow = "#000 0em 0.5em 1em";
        container.style.padding = "1em";
        container.style.border = "solid #345 0.4em";
        container.style.fontSize = "16px";
        container.style.overflow = "auto";
    }

    const head = document.createElement("div");
    {
        head.style.fontWeight = "bold";
        head.style.background = "#123";
        head.style.color = "#eee";
        head.style.padding = "0.3em";
        head.style.margin = "-1em -1em 1em";
        head.style.cursor = "grab";
    }

    const toggle = document.createElement("button");
    toggle.style.marginRight = "1em";
    toggle.append("_");

    let minimized = false;
    toggle.addEventListener("click", ev => {
        if (minimized = !minimized) {
            container.style.maxHeight = "1em";
            container.style.maxWidth = "15em";
            container.style.minWidth = "15em";
            container.style.overflow = "hidden";
        }
        else {
            container.style.maxHeight = "";
            container.style.maxWidth = "";
            container.style.minWidth = "";
            container.style.overflow = "auto";
        }
    });
    head.append(toggle, "μ diagnostics");   

    const propRefCount = document.createElement("div");
    const propRefCountNumber = document.createElement("span");
    propRefCountNumber.append("0");
    propRefCount.append("PropRefs created: ", propRefCountNumber);

    setPropRefDebugCallback(info => {
        propRefCountNumber.replaceChildren(String(info.propRefs));
    }); 

    container.append(head, propRefCount);

    document.body.append(container);

    let xOffset = 0, yOffset = 0;
    head.addEventListener("mousedown", ev => {
        const rect = container.getBoundingClientRect();
        xOffset = ev.x - rect.x;
        yOffset = ev.y - rect.y;

        document.body.addEventListener("mousemove", moveHandler);

        document.body.addEventListener("mouseup", ev => {
            document.body.removeEventListener("mousemove", moveHandler);
        }, { once: true });
        ev.preventDefault();

        function moveHandler(ev: MouseEvent) {
            container.style.left = ev.x - xOffset + "px";
            container.style.top = ev.y - yOffset + "px";
        }
    });
}
