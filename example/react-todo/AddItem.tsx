import * as React from "react";
import { model } from "./model.js";
import { BoundInput } from "mutraction-react";

export function AddItem() {
    function doAdd(ev: React.SyntheticEvent) {
        model.items.push({ title: model.newName });
        model.newName = ""
        ev.preventDefault();
    }

    return <form onSubmit={ doAdd }>
        <label>
            New item:
            <BoundInput bindValue={() => model.newName} />
        </label>
        <button onClick={ doAdd } disabled={ model.newName === "" } >Add</button>
    </form>
}
