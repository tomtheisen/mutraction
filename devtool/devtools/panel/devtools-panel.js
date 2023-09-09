const extensionId = browser.runtime.id;
console.log("setting up pannel");

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

function shipFunction(fn) {
  return browser.devtools.inspectedWindow.eval(`(${ fn.toString() })();`);
}

document.getElementById("button_inspected_eval").addEventListener("click", async () => {
  const [result, err] = await shipFunction(doHighlight);
  console.log({result, err});
});

// Your extension script (e.g., DevTools panel script or popup script)
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle the message from the content or background script
  console.log("Received message from content or background script:", message);

  // Optionally, send a response back to the content or background script
  const responseMessage = "Message received in the extension!";
  sendResponse(responseMessage);
});

const port = browser.runtime.connect({ name: 'devtools-panel' });

port.onMessage.addListener((m) => {
  console.log("devtool panel port received", m)
});

document.getElementById("button_msg_content").addEventListener("click", () => {
  port.postMessage({ name: "message posted from devtools" });
});

document.getElementById("button_version").addEventListener("click", async () => {
  const [result, err] = await shipFunction(() => window[Symbol.for("mutraction-dom")]?.version )
  console.log("version", result);
  if (err) {
    document.getElementById("version").innerText = JSON.stringify(err);
  }
  else if (result) {
    document.getElementById("version").innerText = `Mutraction found @${ result }`;
  }
  else {
    document.getElementById("version").innerText = "No mutraction detected 😞";
  }
});


shipFunction(() => { console.log("setting up mu devtool stuff"); window.marker="was here"; });

