async function shipFunction(fn, ...args) {
	if (fn.name && !fn.name.startsWith("serializable")) 
		throw Error(`Tried to ship non-serializable function '${ fn.name }'`);

    const argsSerialized = args.map(e => JSON.stringify(e)).join();
	const cmd = `(${ fn.toString() })(${ argsSerialized })`;
	const [result, err] = await browser.devtools.inspectedWindow.eval(cmd);
	if (err) throw err;
	return result;
}

function displaySection(name) {
    console.log("[panel] displaying section", name);
    document.querySelectorAll("section[data-section]").forEach(el => {
        el.hidden = el.getAttribute("data-section") !== name;
    });
}

function htmlEncode(str) {
    return str
        .replace(/&/g, '&amp;')    
        .replace(/>/g, '&gt;')   
        .replace(/</g, '&lt;');
}