const extensionId = browser.runtime.id;

const port = browser.runtime.connect({ name: 'devtools-panel' });

displaySection("");

document.getElementById("button_dom_state").addEventListener("click", async () => {
    displaySection("choose-element");
	await runSessionFunction("doHighlight");
});

document.getElementById("button_use_inspected")?.addEventListener("click", async () => {
    displaySection("element");
    await runSessionFunction("selectElement", "$0");
});

document.getElementById("button_history").addEventListener("click", async () => {
    displaySection("history");
    await updateHistory();
});

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
            displaySection("");
			await init();
			break;

        case "selected-element":
            await runSessionFunction("clearObjectSubscriptions");

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

            document.getElementById("element-message").innerText = "";
            document.getElementById("element-dependencies").innerHTML = "";

            if (message.objectIds?.length) {
                for (const id of message.objectIds) {
                    const li = document.createElement("li");
                    li.append("Object");
                    li.append(await getObjectPropListEl(id));
                    document.getElementById("element-dependencies").append(li);
                }
            }
            else {
                document.getElementById("element-message").innerText = "No dependencies or parent elements with dependencies";
            }
            break;

        case "cleanup":
            await runSessionFunction("clearHighlight");
            await shipFunction(serializableStopHistory);
            break;

        case "object-update":
            const { objectId } = message;
            const entries = await runSessionFunction("getObject", String(objectId));
            for (const entry of entries) {
                const selector = `ul[data-object-id="${ objectId }"] li[data-prop="${ entry[0] }"]`;
                for (const el of document.querySelectorAll(selector)) {
                    // TODO normalize with create
                    el.innerHTML = typeof entry[1] === "object"
                        ? `${ htmlEncode(entry[0]) }: <a data-object-id=${ entry[1].id }>obj...</a>`
                        : `${ htmlEncode(entry[0]) }: ${ htmlEncode(JSON.stringify(entry[1])) }`;
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

async function getObjectPropListEl(objectId) {
    await runSessionFunction("subscribeToObject", String(objectId));

    const entries = await runSessionFunction("getObject", String(objectId));
    const ul = document.createElement("ul");
    ul.setAttribute("data-object-id", objectId);
    ul.innerHTML = entries.map(e => {
        return typeof e[1] === "object"
            ? `<li data-prop="${ htmlEncode(e[0]) }">${ htmlEncode(e[0]) }: <a data-object-id=${ e[1].id }>obj...</a>`
            : `<li data-prop="${ htmlEncode(e[0]) }">${ htmlEncode(e[0]) }: ${ htmlEncode(JSON.stringify(e[1])) }`
    }).join('');

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

document.getElementById("connected").addEventListener("click", async ev => {
    const objectId = ev.target.getAttribute("data-object-id");
    console.log("[panel] connected click", { objectId });
    if (ev.target instanceof HTMLAnchorElement && objectId) {
        const ul = getObjectPropListEl(objectId);
        ev.target.replaceWith(ul);
    }
});

window.addEventListener("keydown", ev => {
    // allow console drawer to toggle
    if (ev.key === "Escape") ev.preventDefault();
});
