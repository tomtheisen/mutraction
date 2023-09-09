function serializableDoHighlight() {
    const highlightKey = "data-mutraction-devtool-highlight";
    const session = window[Symbol.for("mutraction-dom")];

    let highlighted = undefined;
    function moveHandler(ev) {
        highlighted?.removeAttribute(highlightKey);

        highlighted = ev.target;
        highlighted.setAttribute(highlightKey, true);
    }
    function clickHandler(ev) {
        highlighted?.removeAttribute(highlightKey);

        document.body.removeEventListener("mousemove", moveHandler);
        window.postMessage({ msg: "actually clicked on " + ev.target.tagName })
    }
    document.body.addEventListener("mousemove", moveHandler);
    document.body.addEventListener("mousedown", clickHandler, { once: true, capture: true });
}

