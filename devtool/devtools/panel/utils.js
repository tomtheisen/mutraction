async function shipFunction(fn, ...args) {
	if (fn.name && !fn.name.startsWith("serializable")) 
		throw Error(`Tried to ship non-serializable function '${ fn.name }'`);

    const argsSerialized = args.map(e => JSON.stringify(e)).join();
	const cmd = `(${ fn.toString() })(${ argsSerialized })`;
	const [result, err] = await browser.devtools.inspectedWindow.eval(cmd);
	if (err) throw err;
	return result;
}

let displayedSection = "";
function displaySection(name) {
    displayedSection = name;
    console.log("[panel] displaying section", name);
    document.querySelectorAll("section[data-section]").forEach(el => {
        el.hidden = el.getAttribute("data-section") !== name;
    });
}

function htmlEncode(str) {
    return String(str)
        .replace(/&/g, '&amp;')    
        .replace(/>/g, '&gt;')   
        .replace(/</g, '&lt;');
}

async function setupSessionFunction(fn) {
    const cmd = `(window[Symbol.for("mutraction-dom")].session.${ fn.name }=${ fn.toString() }).length`;
    // console.log("[setupSessionFunction] setting up session function", {cmd});
	const [result, err] = await browser.devtools.inspectedWindow.eval(cmd);
    if (err) throw err;
    return result;
}

async function runSessionFunction(name, ...args) {
    if (typeof name !== "string") throw Error("name must be a string literal");
    if (args.some(e => typeof e !== "string")) throw Error("args must be string literals");
    const cmd = `window[Symbol.for("mutraction-dom")].session.${ name }(${ args.join() })`;
	const [result, err] = await browser.devtools.inspectedWindow.eval(cmd);
    if (err) throw err;
    return result;
}
