const extensionId = browser.runtime.id;

const port = browser.runtime.connect({ name: 'devtools-panel' });

displaySection("");

async function displayHistory() {
    displaySection("history");
    await updateHistory();
}

document.getElementById("button_dom_state").addEventListener("click", async () => {
    displaySection("choose-element");
    await runSessionFunction("doHighlight");
});

document.getElementById("button_use_inspected")?.addEventListener("click", async () => {
    displaySection("element");
    await runSessionFunction("selectElement", "$0");
});

document.getElementById("button_history").addEventListener("click", displayHistory);

document.getElementById("button_select_parent").addEventListener("click", async () => {
    await runSessionFunction("selectParent");
});

document.getElementById("button_undo").addEventListener("click", async () => {
    await runSessionFunction("undo");
});

document.getElementById("button_redo").addEventListener("click", async () => {
    await runSessionFunction("redo");
});

port.onMessage.addListener(async message => {
    console.log("[panel] recieved port message", message);
    switch (message.type) {
        case "init":
            await init();
            await displayHistory();
            break;

        case "selected-element":
            console.log("[panel] selected-element");
            await runSessionFunction("clearObjectSubscriptions");
            console.log("[panel] done with clearObjectSubscriptions");

            if (message.tagName == null) {
                // nothing selected
                displaySection("choose-element");
                return;
            }
            displaySection("element");
            const tag = message.tagName.toLowerCase();
            const attributes = Object.entries(message.attributes ?? {}).map(attr => 
                `${ attr[0] }="${ attr[1] }"`
            ).join(' ');
            document.getElementById("element-tag").innerText = `<${ tag }${ attributes ? " " : "" }${ attributes }>`;
            console.log("[panel] set element tag text");

            document.getElementById("element-message").innerText = "";
            console.log("[panel] set element message text");
            document.getElementById("element-dependencies").innerHTML = "";
            console.log("[panel] set element dependency text");

            console.log("[panel] selected element object ids", message.objectIds);
            if (message.objectIds?.length) {
                for (const id of message.objectIds) {
                    console.log("[panel] selected element evaluating object id", id);

                    const globalButton = document.createElement("button");
                    globalButton.innerText = "Assign to global";
                    globalButton.setAttribute("data-set-global-id", id);

                    const li = document.createElement("li");
                    li.append("Object ");
                    li.append(globalButton);
                    li.append(await getObjectPropListEl(id));
                    document.getElementById("element-dependencies").append(li);
                }
            }
            else {
                document.getElementById("element-message").innerText = "No dependencies or parent elements with dependencies";
            }
            break;

        case "cleanup":
            await runSessionFunction("stopHighlight");
            await runSessionFunction("clearHighlight");
            await runSessionFunction("stopHistory");
            break;

        case "object-update":
            const { objectId } = message;
            const entries = await runSessionFunction("getObject", String(objectId));
            console.log("[panel] object-update got entries", entries);
            for (const entry of entries) {
                const selector = `ul[data-object-id="${ objectId }"] li[data-prop="${ entry[0] }"]`;

                for (const el of document.querySelectorAll(selector)) {
                    el.innerHTML = objectLiFromEntry(entry);
                }
            }
            break;

        case "history-update":
            if (displaySection === "history");
            await updateHistory();
            break;

        default:
            console.warn("[panel] unknown message type " + message.type, message);
            break;
    }
});

function objectLiFromEntry(entry) {
    const editButtonSrc = `<button class="button_object_prop_edit">Edit</button>`;
    console.log("[objectLiFromEntry] entry", entry);
    if (typeof entry[1] === "object" && entry[1] != null && entry[1].type === "function") {
        return `<li data-prop="${ htmlEncode(entry[0]) }"><code>${ htmlEncode(entry[0]) }</code>: function()`;
    }
    if (typeof entry[1] === "object" && entry[1] != null && entry[1].type === "object") {
        return `<li data-prop="${ htmlEncode(entry[0]) }"><code>${ htmlEncode(entry[0]) }</code>: <a data-object-id=${ entry[1].id }>obj...</a>`;
    }
    return `<li data-prop="${ htmlEncode(entry[0]) }"><code>${ htmlEncode(entry[0]) }</code>: <span class="value">${ htmlEncode(JSON.stringify(entry[1])) }</span> ${ editButtonSrc }`;
}

async function getObjectPropListEl(objectId) {
    console.log("[panel] running getObjectPropListEl");

    await runSessionFunction("subscribeToObject", String(objectId));
    console.log("[panel] done subscribing to object");

    const entries = await runSessionFunction("getObject", String(objectId));
    console.log("[panel] got entries from session function", entries);
    const ul = document.createElement("ul");
    ul.setAttribute("data-object-id", objectId);
    ul.innerHTML = entries.map(objectLiFromEntry).join('');
    console.log("[panel] build object prop ul", ul);        

    return ul;
}

async function updateHistory() {
    const history = await runSessionFunction("getHistory");
    history.reverse();

    console.log("[panel] got history", history);
    const ul = document.getElementById("undo-history");
    ul.innerHTML = "";
    for (const record of history) {
        ul.append(getHistoryLi(record));
    }
}

function getHistoryLi(record) {
    const li = document.createElement("li");
    li.setAttribute("title", record.timestamp);
    switch (record.type) {
        case "create":
            li.innerHTML = `Created property <code>${ htmlEncode(record.name) }</code> with value <code>${ htmlEncode(record.newValue) }</code>`;
            break;
        case "delete":
            li.innerHTML = `Removed property <code>${ htmlEncode(record.name) }</code>`;
            break;
        case "change":
            li.innerHTML = `Updated property <code>${ htmlEncode(record.name) }</code> with value <code>${ htmlEncode(record.newValue) }</code>`;
            break;
        case "arrayextend":
            li.innerHTML = `Extended array <code>${ htmlEncode(record.name) }</code> to index <code>${ record.newIndex }</code> with value <code>${ htmlEncode(record.newValue) }</code>`;
            break;
        case "arrayshorten":
            li.innerHTML = `Shortened array <code>${ htmlEncode(record.name) }</code> to length <code>${ record.newLength }</code>`;
            break;
        case "transaction":
            li.innerHTML = record.transactionName ? `Transaction '${ record.transactionName }'` : `Transaction`;
            break;
    }
    return li;
}

function findNearestAttr(el, attr) {
    for (let curr = el; curr; curr = curr.parentElement) {
        const result = curr.getAttribute(attr);
        if (result) return result;
    }
}

document.getElementById("connected").addEventListener("click", async ev => {
    const objectId = ev.target.getAttribute("data-object-id");
    console.log("[panel] connected click", { objectId });
    if (ev.target instanceof HTMLAnchorElement && objectId) {
        const ul = getObjectPropListEl(objectId);
        ev.target.replaceWith(ul);
    }
    if (ev.target instanceof HTMLButtonElement && ev.target.classList.contains("button_object_prop_edit")) {
        console.log("[panel] clicking edit button");
        const objectId = findNearestAttr(ev.target, "data-object-id");
        const prop = findNearestAttr(ev.target, "data-prop");
        console.log("[panel] found edit props from doc", { prop, objectId });

        const input = document.createElement("input");
        input.value = ev.target.previousElementSibling.innerHTML;
        ev.target.previousElementSibling.remove();
        ev.target.replaceWith(input);
        input.focus();

        input.addEventListener("blur", async () => {
            console.log("[panel] edit blur", { objectId, prop, value: input.value })
            await runSessionFunction("setObjectProp", JSON.stringify(objectId), JSON.stringify(prop), JSON.stringify(input.value));
        }, { once: true });
        input.addEventListener("keypress", async ev => {
            if (ev.key === "Enter") {
                await runSessionFunction("setObjectProp", JSON.stringify(objectId), JSON.stringify(prop), JSON.stringify(input.value));
            }
        })
    }
    if (ev.target instanceof HTMLButtonElement && ev.target.getAttribute("data-set-global-id")) {
        const objectId = ev.target.getAttribute("data-set-global-id");
        console.log("[panel] assigning to global", objectId);

        const globalName = await runSessionFunction("assignToGlobal", String(objectId));
        ev.target.disabled = true;
        ev.target.innerText = globalName;
    }
});

window.addEventListener("keydown", ev => {
    // allow console drawer to toggle
    if (ev.key === "Escape") ev.preventDefault();
});
