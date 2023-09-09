const port = browser.runtime.connect({ name: 'content-script' });

port.onMessage.addListener((m) => {
    console.log("[content] received message from background script: ", m);
});

window.addEventListener("message", (ev) => {
    console.log("[content] window message", ev.data)
    if (ev.source === window) {
        port.postMessage(ev.data);
    }
});
