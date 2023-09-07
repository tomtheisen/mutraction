let mutractionDom: string | undefined;
export async function getMutractionDom(): Promise<string> {
	return mutractionDom ??= `
	declare module 'mutraction-dom' {
		${ await (await fetch("index.d.ts")).text() }
	}`;
}

let jsxDts: string | undefined;
export async function getJsxDts(): Promise<string> {
	return jsxDts ??= await (await fetch("jsx.d.ts")).text();
}
