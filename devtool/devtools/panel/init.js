function serializableMakeLocalSheet() {
    const blocks = [
        `[data-mutraction-devtool-highlight] {
            outline: solid #f0f6 8px !important;
            background: #0ff3 !important;
        }`
    ];

    const sheet = new CSSStyleSheet;
    for (const rules of blocks) {
        sheet.insertRule(rules, 0);
    }
    document.adoptedStyleSheets.push(sheet);
}

function getDependentAncestor(el) {
    let selected = el;
    while (selected && !elementDependencyMap.has(selected)) {
        selected = selected.parentElement;
    }
    return selected;
}

function clearHighlight() {
    const highlightKey = "data-mutraction-devtool-highlight";
    const { session } = window[Symbol.for("mutraction-dom")];
    session.selectedElement?.removeAttribute(highlightKey);
    session.selectedElement = undefined;
}

function selectElement(el) {
    const highlightKey = "data-mutraction-devtool-highlight";
    const { session, elementDependencyMap, objectRepository } = window[Symbol.for("mutraction-dom")];

    session.selectedElement?.removeAttribute(highlightKey);
    session.selectedElement = el;

    if (!session.selectedElement) return;
    session.selectedElement?.setAttribute(highlightKey, true);

    const objects = elementDependencyMap.get(session.selectedElement);
    const objectIds = Array.from(objects ?? [], e => objectRepository.getId(e));

    const msg = { 
        type: "selected-element", 
        tagName: session.selectedElement.tagName, 
        attributes: Object.fromEntries(
            Array.from(session.selectedElement.attributes)
                .filter(attr => !attr.name.startsWith("data-mutraction"))
                .map(attr => [attr.name, attr.value])
        ),
        objectIds,
    };
    window.postMessage(msg);    
}

function selectParent() {
    const { session } = window[Symbol.for("mutraction-dom")];
    if (!session.selectElement) return;
    const ancestor = session.getDependentAncestor(session.selectedElement);
    if (!ancestor) return;
    session.selectElement(ancestor);
}

function doHighlight() {
    const highlightKey = "data-mutraction-devtool-highlight";

    const { session, elementDependencyMap, objectRepository } = window[Symbol.for("mutraction-dom")];
    session.clearHighlight();

    console.log("[doHighlight]", session);

    let highlighted = undefined;

    function moveHandler(ev) {
        highlighted?.removeAttribute(highlightKey);

        highlighted = ev.target;
        highlighted.setAttribute(highlightKey, true);
    }
    
    function clickHandler(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        document.body.removeEventListener("mousemove", moveHandler);
        document.body.removeEventListener("mousedown", preventHandler, { capture: true });

        highlighted?.removeAttribute(highlightKey);

        selected = session.getDependentAncestor(ev.target);
        
        selected?.setAttribute(highlightKey, true);
        session.selectedElement = selected;
        
        const objects = elementDependencyMap.get(selected);
        const objectIds = Array.from(objects ?? [], e => objectRepository.getId(e));
        const msg = { 
            type: "selected-element", 
            tagName: selected?.tagName, 
            attributes: Object.fromEntries(
                Array.from(selected?.attributes ?? [])
                    .filter(attr => !attr.name.startsWith("data-mutraction"))
                    .map(attr => [attr.name, attr.value])
            ),
            objectIds,
        };
        window.postMessage(msg);
    }

    function preventHandler(ev) {
        ev.preventDefault();
        ev.stopPropagation();
    }

    document.body.addEventListener("mousemove", moveHandler);
    document.body.addEventListener("click", clickHandler, { once: true, capture: true });
    document.body.addEventListener("mousedown", preventHandler, { capture: true });
}

async function init() {
    console.log("[panel] init");
    const versionEl = document.getElementById("version");
    const version = await shipFunction(() => window[Symbol.for("mutraction-dom")]?.version );
    console.log("[panel] init found version", version);

    document.getElementById("initial").hidden = true;
    if (version) {
        document.getElementById("connected").hidden = false;
        versionEl.innerText = version;

        await shipFunction(serializableMakeLocalSheet);
        await setupSessionFunction(getDependentAncestor);
        await setupSessionFunction(clearHighlight);
        await setupSessionFunction(selectElement);
        await setupSessionFunction(selectParent);
        await setupSessionFunction(doHighlight);
    }
    else {
        document.getElementById("disconnected").hidden = false;
    }
}
