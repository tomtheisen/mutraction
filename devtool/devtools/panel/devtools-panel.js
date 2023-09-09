/**
When the user clicks each of the first three buttons,
evaluate the corresponding script.
*/
const evalString = "$0.style.backgroundColor = 'red'";
document.getElementById("button_background").addEventListener("click", () => {
  console.log("devtools-panel.js reddinate devtools", browser.devtools);
  browser.devtools.inspectedWindow.eval(evalString)
    .then(arg => console.log(arg));
});

const inspectString = "inspect(document.querySelector('h1'))";
document.getElementById("button_h1").addEventListener("click", () => {
    browser.devtools.inspectedWindow.eval(inspectString)
      .then(arg => console.log(arg));  
}); 

/**
When the user clicks the 'message' button,
send a message to the background script.
*/
// const scriptToAttach = "document.body.innerHTML = 'Hi from the devtools';";
// document.getElementById("button_message").addEventListener("click", () => {
//   browser.runtime.sendMessage({
//     type: "inject-script",
//     tabId: browser.devtools.inspectedWindow.tabId,
//     script: scriptToAttach
//   });
// });

document.getElementById("button_log").addEventListener("click", () => {
  browser.runtime.sendMessage({
    type: "inject-script",
    tabId: browser.devtools.inspectedWindow.tabId,
    script: `console.log("directive from over in DT", window.foo)`
  });
});

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
    browser.runtime.sendMessage({ msg: "hello from bg" });    
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
console.log({extensionId});

// Your extension script (e.g., DevTools panel script or popup script)
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle the message from the content or background script
  console.log("Received message from content or background script:", message);

  // Optionally, send a response back to the content or background script
  const responseMessage = "Message received in the extension!";
  sendResponse(responseMessage);
});

const bgPort = chrome.runtime.connect({ name: 'devtools-panel' });

document.getElementById("button_msg_content").addEventListener("click", () => {
  bgPort.postMessage({ name: "message posted from devtools" });
});
