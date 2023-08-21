import { Router } from "mutraction-dom";
import { getStarted } from "./getStarted.js";
import { todoApp } from "./todo.js";
import { twoWay } from "./twoway.js";
import { intro } from "./intro.js";
import { notFound } from "./notFound.js";
import { tracking } from "./tracking.js";
import { jsx } from "./jsx.js";
import { events } from "./events.js";
import { history } from "./history.js";
import { styles } from "./styles.js";
import { why } from "./why.js";

import { ifelse } from "./ifelse.js"
import { syncEvent } from "./syncEvent.js";
import { forEach } from "./forEach.js";
import { forEachPersist } from "./forEachPersist.js";
import { trackDoc } from "./trackDoc.js";
import { effectDoc } from "./effectDoc.js";
import { routerDoc } from "./routerDoc.js";
import { trackerDoc } from "./trackerDoc.js";

export const routes = Router(
    { pattern: '#start', element: getStarted },
    { pattern: '#tryit', element: <div>Coming soon</div> },

    { pattern: '#topics/tracking', element: tracking },
    { pattern: '#topics/jsx', element: jsx },
    { pattern: '#topics/two-way', element: twoWay },
    { pattern: '#topics/events', element: events },
    { pattern: '#topics/history', element: history },
    { pattern: '#topics/styles', element: styles },

    { pattern: '#ref/ifelse', element: ifelse },
    { pattern: '#ref/syncEvent', element: syncEvent },
    { pattern: '#ref/ForEach', element: forEach },
    { pattern: '#ref/ForEachPersist', element: forEachPersist },
    { pattern: '#ref/track', element: trackDoc },
    { pattern: '#ref/effect', element: effectDoc },
    { pattern: '#ref/Router', element: routerDoc },
    { pattern: '#ref/Tracker', element: trackerDoc },

    { pattern: '#why', element: why },

    { pattern: '#clock', element: () => <>{ new Date }</> },
    { pattern: /#id=(\d+)/, element: match => <>Id match: {match[1]}</> },

    { pattern: /#.+/, element: match => notFound(match[0]) },

    { pattern: '#todo', element: todoApp },

    { element: intro },
);
