import * as React from "react";
import { tracker, itemsSync } from "./items.js";

export const UndoButton = itemsSync(function UndoButton() {
    const disabled = tracker.history.length === 0;
    return <button disabled={ disabled } onClick={ () => tracker.undo() }>
        Undo
    </button>;
});
