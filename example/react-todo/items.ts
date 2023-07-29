import { trackAndSync } from "mutraction-react";
import { TodoItemModel } from "./TodoItemModel.js";

// automatially turn method calls into transactions
const options = { autoTransactionalize: true };

const [_items, _sync, _tracker] = trackAndSync([
    new TodoItemModel("Get some groceries"),
    new TodoItemModel("Feed the cat"),
    new TodoItemModel("Track some mutations"),
], options);

export const items = _items;
export const itemsSync = _sync;
export const tracker = _tracker;
