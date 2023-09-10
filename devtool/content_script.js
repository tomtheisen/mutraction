const port = browser.runtime.connect({ name: 'content-script' });

window.addEventListener("message", (ev) => {
    console.log("[content] window message", ev.data)
    if (ev.source === window) port.postMessage(ev.data);
});
