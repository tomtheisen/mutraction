import { track } from "mutraction";

export type TodoItem = {
    title: string;
    editingTitle?: string;
    editing?: boolean;
    done?: boolean;
}

// automatially turn method calls into transactions
const options = { autoTransactionalize: true };

function modelFactory() {
    return {
        newName: "",
        items: [
            { title: "Get some groceries" },
            { title: "Feed the cat" },
            { title: "Track some mutations" },
        ] as TodoItem[],
    };
}

export const [ model, tracker ] = track(modelFactory(), options);

export function modelReset() {
    Object.assign(model, modelFactory());
}
