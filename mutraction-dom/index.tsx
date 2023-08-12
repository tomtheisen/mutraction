import { track, effect } from 'mutraction';

const [model, tracker] = track({ val: "hello" });

const d = document.createElement("div");
effect(tracker, () => d.innerText = model.val);

/*
const b = <div>{model.val}</div>;
//*/


document.getElementById("root")?.appendChild(d);

setTimeout(() => {
    model.val = "there";
}, 2000);