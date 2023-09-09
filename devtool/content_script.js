// Put all the javascript code here, that you want to execute after page load.

console.log("content_script.js");

// function handleMessage(request, sender, sendResponse) {
//   console.log("content_script.js handleMessage", { request, sender, window });
//   if (request.type === "get-variable") {
//     sendResponse(window.foo);
//   }
// }

// browser.runtime.onMessage.addListener(handleMessage);


const port = chrome.runtime.connect({ name: 'content-script' });

port.postMessage({ greeting: "hello from content script" });

port.onMessage.addListener((m) => {
  console.log("In content script, received message from background script: ", m);
});

document.body.addEventListener("click", () => {
  port.postMessage({ greeting: "they clicked the page!" });
});