import * as React from "react";
import { useTrackerContext } from "mutraction-react";

export function UndoButton() {
    const tracker = useTrackerContext();
    const disabled = tracker.history.length === 0;
    return <button disabled={ disabled } onClick={ () => tracker.undo() }>
        Undo
    </button>;
}
