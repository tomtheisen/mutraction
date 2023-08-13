import { message } from "./message.js";
import { track } from "mutraction";

const [model, tracker] = track({ message });

const div = <div tracker={tracker}>{ model.message }</div>;

const root = document.getElementById("root")!;
root.replaceChildren(div);

model.message = "something else";
