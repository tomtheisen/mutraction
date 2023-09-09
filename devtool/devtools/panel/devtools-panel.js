// for stringification
function doHighlight() {
  let highlighted = undefined;
  function moveHandler(ev) {
    if (highlighted) highlighted.style.outline = "";
    highlighted = ev.target;
    highlighted.style.outline = "solid red 2px";
  }
  function clickHandler(ev) {
    document.body.removeEventListener("mousemove", moveHandler);
    window.postMessage({ msg: "actually clicked on " + ev.target.tagName })
  }
  document.body.addEventListener("mousemove", moveHandler);
  document.body.addEventListener("mousedown", clickHandler, { once: true, capture: true });
}


document.getElementById("button_inspected_eval").addEventListener("click", async () => {
  console.log("devtools-panel.js eval buton");
  const [result, err] = await browser.devtools.inspectedWindow.eval(`{ ${doHighlight.toString()} doHighlight(); }`);
  // const [result, err] = await browser.devtools.inspectedWindow.eval(`inspect(document.body)`);
  console.log({result, err});
});

const extensionId = browser.runtime.id;
console.log("setting up pannel");

// Your extension script (e.g., DevTools panel script or popup script)
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle the message from the content or background script
  console.log("Received message from content or background script:", message);

  // Optionally, send a response back to the content or background script
  const responseMessage = "Message received in the extension!";
  sendResponse(responseMessage);
});

const bgPort = browser.runtime.connect({ name: 'devtools-panel' });
console.log("devtools background port", bgPort);


document.getElementById("button_msg_content").addEventListener("click", () => {
  bgPort.postMessage({ name: "message posted from devtools" });
});
