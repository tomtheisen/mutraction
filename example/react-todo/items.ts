import { track } from "mutraction";
import { TodoItemModel } from "./TodoItemModel.js";

// automatially turn method calls into transactions
const options = { autoTransactionalize: true };

function modelFactory() {
    return [
        new TodoItemModel("Get some groceries"),
        new TodoItemModel("Feed the cat"),
        new TodoItemModel("Track some mutations"),
    ];
}

export const [items, tracker] = track(modelFactory(), options);
