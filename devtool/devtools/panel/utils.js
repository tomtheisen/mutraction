async function shipFunction(fn) {
	if (fn.name && !fn.name.startsWith("serializable")) 
		throw Error(`Tried to ship non-serializable function '${ fn.name }'`);

	const cmd = `(${ fn.toString() })()`;
	const [result, err] = await browser.devtools.inspectedWindow.eval(cmd);
	if (err) throw err;
	return result;
}

function displaySection(name) {
    console.log("[panel] displaying section", name);
    document.querySelectorAll("section[data-section]").forEach(el => {
        console.log("[panel] found query result", el);
        el.hidden = el.getAttribute("data-section") !== name;
    });
}

function htmlEncode(str) {
    return str
        .replace(/>/g, '&gt;')   
        .replace(/</g, '&lt;')    
        .replace(/&/g, '&amp;');
}