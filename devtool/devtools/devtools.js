let port = undefined;
let connected = false;

function openPort() {
  const port = browser.runtime.connect({ name: 'devtools' });

  port.onDisconnect.addListener(p => {
    connected = false;
    if (p.error) {
      console.warn(`[devtool] Disconnected due to an error: ${p.error.message}`);
    }
    else {
      console.log(`[devtool] Disconnected normally`, p);
    }
  });

  return port;
}

function postMessage(msg) {
  if (!connected) port = openPort();
  port.postMessage(msg);
}


browser.devtools.network.onNavigated.addListener((url) => {
  postMessage({ type: "navigation" });
});

/**
Create a panel, and add listeners for panel show/hide events.
*/
browser.devtools.panels.create(
  "Mutraction",
  "/icons/mu.png",
  "/devtools/panel/panel.html"
).then((newPanel) => {
  newPanel.onShown.addListener(() => postMessage({ type: "panel-shown" }));
  newPanel.onHidden.addListener(() => postMessage({ type: "panel-hidden" }));
});

