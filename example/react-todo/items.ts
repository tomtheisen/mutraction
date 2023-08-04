import { trackAndSync } from "mutraction-react";
import { TodoItemModel } from "./TodoItemModel.js";

// automatially turn method calls into transactions
const options = { autoTransactionalize: true };

export const [items, itemsSync, tracker] = trackAndSync([
    new TodoItemModel("Get some groceries"),
    new TodoItemModel("Feed the cat"),
    new TodoItemModel("Track some mutations"),
], options);
