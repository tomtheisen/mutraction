const scopeAttrName = "data-mu-style";
const instanceId = String(Math.random() * 1e6 | 0);

let counter = 0;
export function makeLocalStyle(rules: Record<string, Partial<CSSStyleDeclaration>>) {
    const sheet = new CSSStyleSheet;
    const sheetId = instanceId + "-" + ++counter;
    for (const [selector, declarations] of Object.entries(rules)) {
        const attributeMatch = `[${ scopeAttrName }=${ sheetId }]`;
        sheet.insertRule(`${ attributeMatch }:is(${ selector }), ${ attributeMatch } :is(${ selector }) {}`, 0);
        const rule = sheet.cssRules.item(0) as CSSStyleRule;
        Object.assign(rule.style, declarations);
    }
    document.adoptedStyleSheets.push(sheet);
    return [scopeAttrName, sheetId];
}
