import { track } from "mutraction";
import { TodoItemModel } from "./TodoItemModel.js";

// automatially turn method calls into transactions
const options = { autoTransactionalize: true };

function modelFactory() {
    return {
        newName: "",
        items: [
            new TodoItemModel("Get some groceries"),
            new TodoItemModel("Feed the cat"),
            new TodoItemModel("Track some mutations"),
        ],
    };
}

export const [model, tracker] = track(modelFactory(), options);
