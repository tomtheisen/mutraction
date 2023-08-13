import { message } from "./message.js";

const div = <div>{ message }</div>;

const root = document.getElementById("root")!;
root.replaceChildren(div);
