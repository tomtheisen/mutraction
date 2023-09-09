console.log("background.js");

let contentPort, bgPort;

browser.runtime.onConnect.addListener((port) => {
    console.log("background connect", { port });
    if (port.name === 'content-script') {
        contentPort = port;

        port.onMessage.addListener((message) => {
            console.log("background message", { message, devtoolsPort: bgPort });
            bgPort?.postMessage({ ...message, customs: true });
        });
    } 
    else if (port.name === 'devtools-panel') {
        bgPort = port;

        port.onMessage.addListener((message) => {
            console.log("background message", { message, contentPort });
            contentPort?.postMessage({ ...message, customs: true });
        });
    }
    else {
        console.warn("background connect connect unknown");
    }
});