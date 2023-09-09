let contentPort, devtoolsPort;

browser.runtime.onConnect.addListener((port) => {
    console.log("background connect", port.name);
    if (port.name === 'content-script') {
        contentPort = port;

        port.onMessage.addListener((message) => {
            console.log("background message from content", { message, devtoolsPort });
            devtoolsPort?.postMessage({ ...message, customs: true });
        });

        port.onDisconnect.addListener(p => {
            console.log("background content port disconnection", p);
            if (p.error) console.warn(p.error);
            contentPort = undefined;
        });
    } 
    else if (port.name === 'devtools-panel') {
        devtoolsPort = port;

        port.onMessage.addListener((message) => {
            console.log("background message from devtool", { message, contentPort });
            contentPort?.postMessage({ ...message, customs: true });
        });
    }
    else {
        console.warn("background connect connect unknown");
    }
});