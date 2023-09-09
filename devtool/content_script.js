const port = browser.runtime.connect({ name: 'content-script' });

port.onMessage.addListener((m) => {
  console.log("In content script, received message from background script: ", m);
});

// document.body.addEventListener("click", () => {
//   port.postMessage({ greeting: "they clicked the page!" });
// });


window.addEventListener("message", (ev) => {
  console.log("content window message", ev.data)
  if (
    ev.source === window
  ) {
    port.postMessage(ev.data);
  }
});