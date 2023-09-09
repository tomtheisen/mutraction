async function shipFunction(fn) {
	if (fn.name && !fn.name.startsWith("serializable")) 
		throw Error(`Tried to ship non-serializable function '${ fn.name }'`);

	const cmd = `(${ fn.toString() })()`;
	const [result, err] = await browser.devtools.inspectedWindow.eval(cmd);
	if (err) throw err;
	return result;
}

