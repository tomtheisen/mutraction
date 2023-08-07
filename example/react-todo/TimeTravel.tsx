import * as React from "react";
import { useTrackerContext } from "mutraction-react";
import { model, modelReset } from "./model.js";

const localKey = "mutraction:todo"

function saveToLocal() {
    localStorage.setItem(localKey, JSON.stringify(model));
}

function loadFromLocal() {
    const saved = localStorage.getItem(localKey);
    if (saved) {
        Object.assign(model, JSON.parse(saved));
    }
    else {
        alert("Nothing found");
    }
}

export function TimeTravel() {
    const tracker = useTrackerContext();
    const undoDisabled = tracker.history.length === 0;

    return <>
        <button disabled={ undoDisabled } onClick={ () => tracker.undo() }>Undo</button>
        <button onClick={ modelReset }>Factory Reset</button>
        <button onClick={ () => tracker.clearHistory() }>Clear History</button>
        <button onClick={ saveToLocal }>Save to localStorage</button>
        <button onClick={ loadFromLocal }>Load from localStorage</button>
    </>;
}
