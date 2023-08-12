import { track } from 'mutraction';
import { child, element } from './runtime.js';



/*
 * 
 * For example
 * 
 */
const [model, tracker] = track({ val: "hello", tab: 5, show: false });

const d = element("div", { tabIndex: () => model.tab },
    child(() => model.val),
    child(() => element("p", {}, "just something")),
    child(() => element("p", { classList: () => ({ stinky: model.show }) }, "touch of class")),
    element("p", { style: () => ({ outline: "green solid 2px" }) }, "just something unwrapped once"),
    child(() => element("p", { if: () => model.show }, "intermittently")),
    child(() => element("p", { if: () => false }, "never")),
    ""
);

/*
const b = <div tabIndex={model.tab}>{model.val}</div>;
//*/


document.getElementById("root")?.replaceChildren(d);

let x = 0;
setInterval(() => {
    model.val = ++x + "";
}, 100);

setInterval(() => {
    model.tab++;
}, 250);

setInterval(() => model.show = !model.show, 1000);
