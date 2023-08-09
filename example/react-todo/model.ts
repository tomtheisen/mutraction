import { track } from "mutraction";

export type TodoItem = {
    title: string;
    editingTitle: string;
    editing: boolean;
    done: boolean;
}

export function makeTodoItem(title: string): TodoItem {
    return { title, done: false, editing: false, editingTitle: "" };
}

function modelFactory() {
    return {
        newName: "",
        items: [
            makeTodoItem("Get some groceries"),
            makeTodoItem("Feed the cat"),
            makeTodoItem("Track some mutations"),
        ],
    };
}

// automatially turn method calls into transactions
export const [ model, tracker ] = track(modelFactory(), { autoTransactionalize: true });

export function modelReset() {
    Object.assign(model, modelFactory());
}
