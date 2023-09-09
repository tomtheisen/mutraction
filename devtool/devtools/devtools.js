const port = browser.runtime.connect({ name: 'devtools' });

browser.devtools.network.onNavigated.addListener((url) => {
  port.postMessage({ type: "navigation" });
});

/**
Create a panel, and add listeners for panel show/hide events.
*/
browser.devtools.panels.create(
  "Mutraction",
  "/icons/mu.png",
  "/devtools/panel/panel.html"
).then((newPanel) => {
  newPanel.onShown.addListener(() => port.postMessage({ type: "panel-shown" }));
  newPanel.onHidden.addListener(() => port.postMessage({ type: "panel-hidden" }));
});

