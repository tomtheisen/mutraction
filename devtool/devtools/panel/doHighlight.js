function serializableSelectInspected() {
    const highlightKey = "data-mutraction-devtool-highlight";
    const devtoolExport = window[Symbol.for("mutraction-dom")]
    const { session, elementDependencyMap, objectRepository } = devtoolExport;

    session.selectedElement?.removeAttribute(highlightKey);
    session.selectedElement = $0;

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

function serializableSelectParent() {
    const highlightKey = "data-mutraction-devtool-highlight";
    const devtoolExport = window[Symbol.for("mutraction-dom")]
    const { session, elementDependencyMap, objectRepository } = devtoolExport;

    if (!session.selectedElement) return;
    session.selectedElement.removeAttribute(highlightKey);
    session.selectedElement = session.selectedElement.parentElement;

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

function serializableClearHighlight() {
    const highlightKey = "data-mutraction-devtool-highlight";
    const { session } = window[Symbol.for("mutraction-dom")];
    session.selectedElement?.removeAttribute(highlightKey);
    session.selectedElement = undefined;
}

function serializableDoHighlight() {
    const highlightKey = "data-mutraction-devtool-highlight";
    const devtoolExport = window[Symbol.for("mutraction-dom")]
    const { session, elementDependencyMap, objectRepository } = devtoolExport;
    console.log("[doHighlight]", session);

    let highlighted = undefined;
    session.selectedElement?.removeAttribute(highlightKey);
    session.selectedElement = undefined;

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
        session.selectedElement = ev.target;
        session.selectedElement.setAttribute(highlightKey, true);
        
        const objects = elementDependencyMap.get(ev.target);
        const objectIds = Array.from(objects ?? [], e => objectRepository.getId(e));
        const msg = { 
            type: "selected-element", 
            tagName: ev.target.tagName, 
            attributes: Object.fromEntries(
                Array.from(ev.target.attributes)
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

