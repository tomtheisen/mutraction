import { Router } from "mutraction-dom";
import { getStarted } from "./getStarted.js";
import { todoApp } from "./todo.js";
import { binding } from "./binding.js";
import { intro } from "./intro.js";
import { notFound } from "./notFound.js";
import { tracking } from "./tracking.js";

export const routes = Router(
    { pattern: '#start', element: getStarted() },
    { pattern: '#todo', element: todoApp },
    { pattern: '#topics/tracking', element: tracking },
    { pattern: /#id=(\d+)/, element: match => <>You can match: {match[1]}</> },
    { pattern: '#2way', element: binding() },
    { pattern: /#.+/, element: match => notFound(match[0]) },
    { element: intro },
);
