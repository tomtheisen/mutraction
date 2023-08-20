import { Router } from "mutraction-dom";
import { getStarted } from "./getStarted.js";
import { todoApp } from "./todo.js";
import { binding } from "./binding.js";
import { intro } from "./intro.js";

export const routes = Router(
    { pattern: '#start', element: getStarted() },
    { pattern: '#todo', element: todoApp },
    { pattern: /#id=(\d+)/, element: match => <>You can match: {match[1]}</> },
    { pattern: '#2way', element: binding() },
    { pattern: /#.+/, element: match => <>No route found for {match[0]}</> },
    { element: intro }
);
