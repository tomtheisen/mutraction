import { Router } from "mutraction-dom";

import { getStarted } from "./topics/getStarted.js";
import { oneWay } from "./topics/oneway.js";
import { twoWay } from "./topics/twoway.js";
import { intro } from "./topics/intro.js";
import { notFound } from "./topics/notFound.js";
import { tracking } from "./topics/tracking.js";
import { jsx } from "./topics/jsx.js";
import { events } from "./topics/events.js";
import { history } from "./topics/history.js";
import { styles } from "./topics/styles.js";
import { debug } from "./topics/debug.js";

import { ifelse } from "./ref/ifelse.js"
import { syncEvent } from "./ref/syncEvent.js";
import { apply } from "./ref/apply.js";
import { ref } from "./ref/ref.js";
import { forEach } from "./ref/forEach.js";
import { promiseLoader } from "./promiseLoader.js";
import { swapper } from "./ref/swapper.js";
import { trackDoc } from "./ref/trackDoc.js";
import { effectDoc } from "./ref/effectDoc.js";
import { routerDoc } from "./ref/routerDoc.js";
import { trackerDoc } from "./ref/trackerDoc.js";
import { makeLocalStyleDoc } from "./ref/makeLocalStyleDoc.js";
import { neverTrackDoc } from "./ref/neverTrackDoc.js";
import { untrackedCloneDoc } from "./ref/untrackedCloneDoc.js";

import { mounting } from "./recipes/mounting.js";
import { radio } from "./recipes/radio.js";
import { spinner } from "./recipes/spinner.js";
import { array } from "./recipes/array.js";
import { html } from "./recipes/html.js";
import { computed } from "./recipes/computed.js";

import { examples } from "./examples.js";
import { faq } from "./faq.js";
import { why } from "./why.js";


export const routes = Router(
    { pattern: '#start', element: getStarted },

    { pattern: '#topics/tracking', element: tracking },
    { pattern: '#topics/jsx', element: jsx },
    { pattern: '#topics/one-way', element: oneWay },
    { pattern: '#topics/two-way', element: twoWay },
    { pattern: '#topics/events', element: events },
    { pattern: '#topics/history', element: history },
    { pattern: '#topics/styles', element: styles },
    { pattern: '#topics/debug', element: debug },

    { pattern: '#ref/ifelse', element: ifelse },
    { pattern: '#ref/syncEvent', element: syncEvent },
    { pattern: '#ref/ref', element: ref },
    { pattern: '#ref/ForEach', element: forEach },
    { pattern: '#ref/PromiseLoader', element: promiseLoader },
    { pattern: '#ref/Swapper', element: swapper },
    { pattern: '#ref/track', element: trackDoc },
    { pattern: '#ref/effect', element: effectDoc },
    { pattern: '#ref/Router', element: routerDoc },
    { pattern: '#ref/Tracker', element: trackerDoc },
    { pattern: '#ref/apply', element: apply },
    { pattern: '#ref/makeLocalStyle', element: makeLocalStyleDoc },
    { pattern: '#ref/neverTrack', element: neverTrackDoc },
    { pattern: '#ref/untrackedClone', element: untrackedCloneDoc },

    { pattern: '#recipes/mounting', element: mounting },
    { pattern: '#recipes/radio', element: radio },
    { pattern: '#recipes/spinner', element: spinner },
    { pattern: '#recipes/array', element: array },
    { pattern: '#recipes/html', element: html },
    { pattern: '#recipes/computed', element: computed },

    { pattern: '#examples', element: examples },
    { pattern: '#why', element: why },
    { pattern: '#faq', element: faq },

    { pattern: '#clock', element: () => <>{ new Date }</> },
    { pattern: /#id=(\d+)/, element: match => <>Id match: {match[1]}</> },

    { pattern: /#.+/, element: match => notFound(match[0]) },

    { element: intro },
);
