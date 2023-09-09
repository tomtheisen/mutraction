let contentPort, panelPort, devtoolsPort;

browser.runtime.onConnect.addListener((port) => {
    console.log("[background] connect", port.name);
    switch (port.name) {
        case 'content-script':
            contentPort = port;

            panelPort?.postMessage({ msg: "Content just connected" });

            port.onMessage.addListener((message) => {
                console.log("[background] message from content", message);
                panelPort?.postMessage({ ...message, customs: true });
            });

            port.onDisconnect.addListener(p => {
                console.log("[background] content port disconnection", p);
                if (p.error) console.warn(p.error);
                contentPort = undefined;
            });
            break;

        case 'devtools-panel':
            panelPort = port;

            port.onMessage.addListener((message) => {
                console.log("[background] message from panel", message);
                contentPort?.postMessage({ ...message, customs: true });
            });

            port.onDisconnect.addListener(p => {
                console.log("[background] devtool port disconnection", p);
                if (p.error) console.warn(p.error);
                panelPort = undefined;
            });
            break;

        case 'devtools':
            devtoolsPort = port;

            port.onMessage.addListener((message) => {
                switch (message.type) {
                    case 'navigation':
                        panelPort?.postMessage({ type: "init"  });
                        break;

                    case "panel-shown":
                        panelPort?.postMessage({ type: "init"  });
                        break;

                    case "panel-hidden":
                        break;

                    default:
                        console.warn('[background] unknown devtools message type ' + message.type);
                }
                console.log("[background] message from devtools", message);
            });
            break;

        default:
            console.warn("[background] connect unknown", port.name);
            break;
    }
});
