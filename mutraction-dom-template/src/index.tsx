import { Router } from "mutraction-dom";
import { app } from "./app.js";

const about = (
    <p>This is all about the stuff.</p>
);

const router = Router(
    { pattern: /#about$/, element: about },
    { pattern: /#id=(\d+)/, element: match => <>Id: {match[1]}</> },
    { element: app }
);

document.getElementById("root")!.replaceChildren(router);
