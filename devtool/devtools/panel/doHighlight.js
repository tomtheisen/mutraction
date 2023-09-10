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
        highlighted?.removeAttribute(highlightKey);
        session.selectedElement = ev.target;
        session.selectedElement.setAttribute(highlightKey, true);
        
        const objects = elementDependencyMap.get(ev.target);
        const objectIds = objects?.map(e => objectRepository.getId(e));

        document.body.removeEventListener("mousemove", moveHandler);
        const msg = { 
            type: "selected-element", 
            tagName: ev.target.tagName, 
            attributes: Object.fromEntries(
                Array
                    .from(ev.target.attributes)
                    .filter(attr => !attr.name.startsWith("data-mutraction"))
                    .map(attr => [attr.name, attr.value])
            ),
            objectIds,
        };
        window.postMessage(msg);

        ev.preventDefault();
    }

    document.body.addEventListener("mousemove", moveHandler);
    document.body.addEventListener("click", clickHandler, { once: true, capture: true });
}

