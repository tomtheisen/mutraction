import * as BabelCoreNamespace from '@babel/core';
const t = BabelCoreNamespace.types;
function jsxChild(child) {
    const type = child.type;
    if (type === "JSXText") {
        const value = child.value.trim();
        if (value === "")
            return null;
        return t.stringLiteral(value);
    }
    else if (type === "JSXElement") {
        return child;
    }
    else if (type === "JSXExpressionContainer") {
        if (child.expression.type === "JSXEmptyExpression")
            return null;
        return t.callExpression(t.identifier(ctx.childFnName), [
            t.arrowFunctionExpression([], child.expression)
        ]);
    }
    else if (type === "JSXFragment") {
        return t.stringLiteral("NIE fragment");
    }
    else if (type === "JSXSpreadChild") {
        return t.stringLiteral("NIE spread child");
    }
    throw Error("Unsupported child type " + type);
}
function jsxId2Id(name) {
    if (name.type === "JSXIdentifier")
        return t.identifier(name.name);
    return t.memberExpression(jsxId2Id(name.object), t.identifier(name.property.name));
}
function jsxProp(attr) {
    const type = attr.type;
    if (type === 'JSXAttribute') {
        if (attr.name.type === 'JSXNamespacedName')
            throw Error("Unsupported namespace in JSX attribute");
        return t.objectProperty(t.identifier(attr.name.name), jsxAttrVal2Prop(attr.value));
    }
    else if (type === 'JSXSpreadAttribute') {
        return t.spreadElement(attr.argument);
    }
    throw Error('Unsupported attribute type: ' + type);
}
function jsxAttrVal2Prop(attrVal) {
    // bare attribute e.b. <input disabled />
    if (!attrVal)
        return t.booleanLiteral(true);
    const type = attrVal.type;
    if (type === 'StringLiteral') {
        return t.stringLiteral(attrVal.value);
    }
    else if (type === 'JSXExpressionContainer') {
        if (attrVal.expression.type === 'JSXEmptyExpression')
            return t.booleanLiteral(true);
        return t.arrowFunctionExpression([], attrVal.expression);
    }
    else {
        return attrVal; // process later / TODO?
    }
}
let ctx = undefined;
const mutractPlugin = {
    visitor: {
        Program: {
            enter(path) {
                path.node.sourceType = "module";
                const elementFnName = path.scope.generateUid("mu_element");
                const childFnName = path.scope.generateUid("mu_child");
                ctx = { elementFnName, childFnName };
                path.node.body.unshift(t.importDeclaration([
                    t.importSpecifier(t.identifier(elementFnName), t.identifier("element")),
                    t.importSpecifier(t.identifier(childFnName), t.identifier("child")),
                ], t.stringLiteral("mutraction-dom")));
            },
            exit(path) {
                ctx = undefined;
            }
        },
        JSXElement(path) {
            const { name } = path.node.openingElement;
            if (name.type === "JSXNamespacedName")
                throw path.buildCodeFrameError("This JSX element type is not supported");
            const props = path.node.openingElement.attributes.map(jsxProp);
            try {
                if (name.type === "JSXIdentifier" && /^[a-z]/.test(name.name)) {
                    // treat as DOM element
                    const jsxChildren = [];
                    for (const child of path.node.children) {
                        const compiled = jsxChild(child);
                        if (compiled)
                            jsxChildren.push(compiled);
                    }
                    path.replaceWith(t.callExpression(t.identifier(ctx.elementFnName), [
                        t.stringLiteral(name.name),
                        t.objectExpression(props),
                        ...jsxChildren
                    ]));
                    return;
                }
                // it's a component, these things practically render themselves
                path.replaceWith(t.callExpression(jsxId2Id(name), [t.objectExpression(props)]));
            }
            catch (err) {
                path.buildCodeFrameError(err instanceof Error ? err.message : String(err));
            }
        }
    }
};
export default function (_) {
    return mutractPlugin;
}