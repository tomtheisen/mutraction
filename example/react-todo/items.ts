import { trackAndSync } from "mutraction-react";
import { TodoItemModel } from "./TodoItemModel.js";

const [_items, _sync] = trackAndSync([] as TodoItemModel[]);
export const items = _items;
export const itemsSync = _sync;
