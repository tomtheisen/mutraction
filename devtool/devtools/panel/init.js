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

function serializableStartHistory() {
    const { defaultTracker, session } = window[Symbol.for("mutraction-dom")];

    session.historyDependency?.untrackAll();

    const dl = defaultTracker.startDependencyTrack();
    defaultTracker.history.length;
    dl.endDependencyTrack();

    dl.subscribe(() => {
        const msg = { type: "history-update" };
        window.postMessage(msg);        
    });
    session.historyDependency = dl;
}

const sessionFunctions = {
    getDependentAncestor: function(el) {
        let selected = el;
        while (selected && !elementDependencyMap.has(selected)) {
            selected = selected.parentElement;
        }
        return selected;
    },

    clearHighlight: function() {
        const highlightKey = "data-mutraction-devtool-highlight";
        const { session } = window[Symbol.for("mutraction-dom")];
        session.selectedElement?.removeAttribute(highlightKey);
        session.selectedElement = undefined;
    },

    selectElement: function(el) {
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
    },

    selectParent: function() {
        const { session } = window[Symbol.for("mutraction-dom")];
        if (!session.selectElement) return;
        const ancestor = session.getDependentAncestor(session.selectedElement);
        if (!ancestor) return;
        session.selectElement(ancestor);
    },

    doHighlight: function() {
        const highlightKey = "data-mutraction-devtool-highlight";

        const { session, elementDependencyMap, objectRepository } = window[Symbol.for("mutraction-dom")];
        session.clearHighlight();

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

            selected = session.getDependentAncestor(ev.target) ?? ev.target;
            
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
    },

    getObject: function(id) {
        const { objectRepository } = window[Symbol.for("mutraction-dom")];

        const obj = objectRepository.getObject(Number(id));
        console.log("[getObject] called", { id, obj });
        if (!obj) return undefined;

        return Object.entries(obj).map(e => {
            if (e[1] === null || typeof e[1] !== "object") return e;
            return [e[0], { id: objectRepository.getId(e[1]) } ];
        });
    },

    subscribeToObject: function(id) {
        const { session, objectRepository } = window[Symbol.for("mutraction-dom")];

        const obj = objectRepository.getObject(Number(id));
        if (!obj) return undefined;

        const keys = Object.keys(obj);
        console.log("[session] subscribing to object", { obj, keys });
        const dl = defaultTracker.startDependencyTrack();
        for (const key of keys) obj[key];
        dl.endDependencyTrack();

        session.activeObjectSubscriptions ??= [];
        session.activeObjectSubscriptions.push(dl);

        dl.subscribe(() => {
            const msg = {
                type: "object-update",
                objectId: id,
            };
            window.postMessage(msg);
        });
    },

    clearObjectSubscriptions: function() {
        const { session } = window[Symbol.for("mutraction-dom")];

        if (!session.activeObjectSubscriptions) return;
        session.activeObjectSubscriptions.forEach(dl => dl.untrackAll());
        session.activeObjectSubscriptions.length = 0;
    },

    getHistory: function() {
        const { defaultTracker } = window[Symbol.for("mutraction-dom")];

        const result = defaultTracker.history.slice(-100).map(e => {
            // remove objects
            const {parent, operations, dependencies, target, ...rest} = e;
            return rest;
        });

        return result;
    }
};

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
        await shipFunction(serializableStartHistory);

        for (const name in sessionFunctions) {
            console.log("[init] setting up session function", name);
            await setupSessionFunction(sessionFunctions[name]);
        }
    }
    else {
        document.getElementById("disconnected").hidden = false;
    }
}
