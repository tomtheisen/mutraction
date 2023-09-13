let port = openPort();
let connected = true;

function openPort() {
    let port = browser.runtime.connect({ name: 'content-script' });

    port.onDisconnect.addListener((p) => {
        connected = false;
        if (p.error) {
            console.warn(`[content] Disconnected due to an error: ${p.error.message}`);
        }
        else {
            console.log(`[content] Disconnected normally`, p);
        }
    });

    return port;
}

window.addEventListener("message", (ev) => {
    console.log("[content] window message", ev.data)
    if (ev.source === window) {
        if (!connected) port = openPort();
        port.postMessage(ev.data);
    }
});
