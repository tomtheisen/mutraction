/**
This script is run whenever the devtools are open.
In here, we can create our panel.
*/

function handleShown() {
  port.postMessage({ type: "panel-shown" });
}

function handleHidden() {
  port.postMessage({ type: "panel-hidden" });
}

/**
Create a panel, and add listeners for panel show/hide events.
*/
browser.devtools.panels.create(
  "Mutraction",
  "/icons/mu.png",
  "/devtools/panel/panel.html"
).then((newPanel) => {
  newPanel.onShown.addListener(handleShown);
  newPanel.onHidden.addListener(handleHidden);
});

const port = browser.runtime.connect({ name: 'devtools' });

browser.devtools.network.onNavigated.addListener((url) => {
  port.postMessage({ type: "navigation" });
});
