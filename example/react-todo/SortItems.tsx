import * as React from "react";
import { items, itemsSync } from "./items.js";

function moveFinishedToBottom() {
    items.sort((a, b) => Number(a.done) - Number(b.done));
}

export const SortItems = itemsSync(function SortItems() {
    return <div>
        <button onClick={moveFinishedToBottom}>
            Sort by unfinished
        </button>
    </div>;
});

