import { NodeModifier } from "./types.js";

const scopeAttrName = "data-mu-style";
const instanceId = String(Math.random() * 1e6 | 0);

let counter = 0;

/**
 * Makes a reusable scoped stylesheet that can be applied to JSX elements using `mu:apply`.
 * @param rules is a stylesheet object with selectors as keys and CSS rule delcaration objects as values.
 * @returns a node modifier that can be provided to `mu:apply`
 * @example
 * ```tsx
 * const myStyle = makeLocalStyle({
 *   "p": { fontFamily: "sans-serif" }
 * });
 * const app = <div mu:apply={ myStyle }>
 *   <p>Hello</p>
 * </div>;
 * ```
 */
export function makeLocalStyle(rules: Record<string, Partial<CSSStyleDeclaration>>): NodeModifier {
    const sheet = new CSSStyleSheet;
    const sheetId = instanceId + "-" + ++counter;
    for (const [selector, declarations] of Object.entries(rules)) {
        // transform the given selector `xyz`
        // into `[data-mu-style=1234-56]:is(xyz), [data-mu-style=1234-56] :is(xyz)`
        const attributeMatch = `[${ scopeAttrName }="${ sheetId }"]`;
        const localSelector = `${ attributeMatch }:is(${ selector }), ${ attributeMatch } :is(${ selector }) {}`;
        sheet.insertRule(localSelector, 0);
        const rule = sheet.cssRules.item(0) as CSSStyleRule;
        Object.assign(rule.style, declarations);
    }
    document.adoptedStyleSheets.push(sheet);
    return { $muType: "attribute", name: scopeAttrName, value: sheetId };
}
