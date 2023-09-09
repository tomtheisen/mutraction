const extensionId = browser.runtime.id;

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
	console.log("Received message from content or background script:", message);
	sendResponse("Message received in the extension!");
});

const port = browser.runtime.connect({ name: 'devtools-panel' });

document.getElementById("button_inspected_eval").addEventListener("click", async () => {
	const result = await shipFunction(serializableDoHighlight);
	console.log(result);
});

document.getElementById("button_msg_content").addEventListener("click", () => {
	port.postMessage({ name: "message posted from devtools" });
});

port.onMessage.addListener((message) => {
	switch (message.type) {
		case "init":
			init();
			break;

		default:
			console.warn("[panel] unknown message type " + message.type);
			break;
	}
});

