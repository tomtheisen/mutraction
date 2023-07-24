import * as React from "react";
import { items } from "./items.js";

function moveFinishedToBottom() {
    items.sort((a, b) => Number(a.done) - Number(b.done));
}

export function SortItems() {
    return <button onClick={moveFinishedToBottom}>
        Sort by unfinished
    </button>;
}
