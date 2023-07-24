import * as React from "react";
import { tracker } from "./items.js";

export function UndoButton() {
    return <button onClick={() => tracker.undo() }>
        Undo
    </button>;
}
