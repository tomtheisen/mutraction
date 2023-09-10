const extensionId = browser.runtime.id;

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
	console.log("Received message from content or background script:", message);
	sendResponse("Message received in the extension!");
});

const port = browser.runtime.connect({ name: 'devtools-panel' });

displaySection("");
document.getElementById("button_dom_state").addEventListener("click", async () => {
    displaySection("choose-element");
	await shipFunction(serializableDoHighlight);
});

document.getElementById("button_history").addEventListener("click", () => {
    displaySection("history");
});

document.getElementById("button_msg_content").addEventListener("click", () => {
	port.postMessage({ name: "message posted from devtools" });
});

port.onMessage.addListener((message) => {
	switch (message.type) {
		case "init":
            displaySection("");
			init();
			break;

        case "selected-element":
            displaySection("element");
            const tag = message.tagName.toLowerCase();
            const attributes = Object.entries(message.attributes ?? {}).map(attr => 
                `${ attr[0] }="${ attr[1] }"`
            ).join(' ');
            document.getElementById("element-tag").innerText = `<${ tag }${ attributes ? " " : "" }${ attributes }>`;
            break;

        case "cleanup":
            shipFunction(serializableClearHighlight);
            break;

		default:
			console.warn("[panel] unknown message type " + message.type, message);
			break;
	}
});

