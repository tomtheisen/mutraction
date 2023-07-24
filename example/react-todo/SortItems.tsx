import * as React from "react";
import { items, tracker } from "./items.js";

function moveFinishedToBottom() {
    tracker.startTransaction();
    items.sort((a, b) => Number(a.done) - Number(b.done));
    tracker.commit();
}

export function SortItems() {
    return <button onClick={moveFinishedToBottom}>
        Sort by unfinished
    </button>;
}
