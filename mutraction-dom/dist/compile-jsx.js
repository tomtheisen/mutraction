import * as B from '@babel/core';
const t = B.types;
function jsxChild(ctx, child) {
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
        return t.callExpression(t.identifier(ctx.childFnName), [t.arrowFunctionExpression([], child.expression)]);
    }
    else if (type === "JSXFragment") {
        return child;
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
function isProgram(path) {
    return path?.node.type === "Program";
}
let _ctx = undefined;
function clearImports() {
    _ctx = undefined;
}
function ensureImportsCreated(path) {
    const programPath = path.findParent(isProgram);
    if (!isProgram(programPath))
        throw Error("Can't create imports outside of a program.");
    if (_ctx)
        return _ctx;
    programPath.node.sourceType = "module";
    const elementFnName = programPath.scope.generateUid("mu_element");
    const childFnName = programPath.scope.generateUid("mu_child");
    const setTrackerFnName = programPath.scope.generateUid("mu_setTracker");
    const clearTrackerFnName = programPath.scope.generateUid("mu_clearTracker");
    programPath.node.body.unshift(t.importDeclaration([
        t.importSpecifier(t.identifier(elementFnName), t.identifier("element")),
        t.importSpecifier(t.identifier(childFnName), t.identifier("child")),
        t.importSpecifier(t.identifier(setTrackerFnName), t.identifier("setTracker")),
        t.importSpecifier(t.identifier(clearTrackerFnName), t.identifier("clearTracker")),
    ], t.stringLiteral("mutraction-dom")));
    return _ctx = { elementFnName, childFnName, setTrackerFnName, clearTrackerFnName };
}
function isMutractionNamespace(ns) {
    return ns.name === "mu" || ns.name === "µ";
}
const mutractPlugin = {
    visitor: {
        Program: {
            enter(path) { },
            exit(path) {
                clearImports();
            }
        },
        JSXElement(path) {
            const ctx = ensureImportsCreated(path);
            const { name } = path.node.openingElement;
            if (name.type === "JSXNamespacedName")
                throw path.buildCodeFrameError("JSXNamespacedName JSX element type is not supported");
            let trackerExpression = undefined;
            // build props and look for tracker attribute
            const propsForRuntime = [];
            for (const attr of path.node.openingElement.attributes) {
                switch (attr.type) {
                    case 'JSXAttribute':
                        switch (attr.name.type) {
                            case 'JSXNamespacedName':
                                const { name, value } = attr;
                                if (!isMutractionNamespace(name.namespace))
                                    throw Error(`Unsupported namespace ${name.namespace.name} in JSX attribute`);
                                switch (name.name.name) { // lol babel
                                    case "tracker":
                                        if (value?.type !== "JSXExpressionContainer")
                                            throw Error(`Expression value expected for '${name.name.name}'`);
                                        if (value.expression.type === "JSXEmptyExpression")
                                            break;
                                        trackerExpression = value.expression;
                                        break;
                                    case "if":
                                        if (value?.type !== "JSXExpressionContainer")
                                            throw Error(`Expression value expected for '${name.name.name}'`);
                                        if (value.expression.type === "JSXEmptyExpression")
                                            break;
                                        propsForRuntime.push(t.objectProperty(t.stringLiteral("mu:" + name.name.name), jsxAttrVal2Prop(value)));
                                        break;
                                    default:
                                        throw Error(`Unsupported mutraction JSX attribute ${name.name.name}`);
                                }
                                break;
                            case 'JSXIdentifier':
                                propsForRuntime.push(t.objectProperty(t.identifier(attr.name.name), jsxAttrVal2Prop(attr.value)));
                                break;
                        }
                        break;
                    case 'JSXSpreadAttribute':
                        propsForRuntime.push(t.spreadElement(attr.argument)); // TODO: probably doesn't work
                        break;
                    default:
                        throw Error('Unsupported attribute type.');
                }
            }
            let renderFunc = undefined;
            if (name.type === "JSXIdentifier" && /^[a-z]/.test(name.name)) {
                // treat as DOM element
                const jsxChildren = [];
                for (const child of path.node.children) {
                    const compiled = jsxChild(ctx, child);
                    if (compiled)
                        jsxChildren.push(compiled);
                }
                renderFunc = t.callExpression(t.identifier(ctx.elementFnName), [
                    t.stringLiteral(name.name),
                    t.objectExpression(propsForRuntime),
                    ...jsxChildren
                ]);
            }
            else { // JSXMemberExpression or upper-case function component
                throw Error("Embed function 'components' with curly braces, not jsx.");
            }
            if (trackerExpression) {
                const trackedRoot = t.memberExpression(t.arrayExpression([
                    t.callExpression(t.identifier(ctx.setTrackerFnName), [trackerExpression]),
                    renderFunc,
                    t.callExpression(t.identifier(ctx.clearTrackerFnName), [])
                ]), t.numericLiteral(1), true /* computed */);
                path.replaceWith(trackedRoot);
            }
            else {
                path.replaceWith(renderFunc);
            }
        },
        JSXFragment(path) {
            const ctx = ensureImportsCreated(path);
            const jsxChildren = [];
            for (const child of path.node.children) {
                const compiled = jsxChild(ctx, child);
                if (compiled)
                    jsxChildren.push(compiled);
            }
            const fragId = path.scope.generateDeclaredUidIdentifier("frag");
            path.replaceExpressionWithStatements([
                // frag = document.createDocumentFragment()
                t.expressionStatement(t.assignmentExpression("=", fragId, t.callExpression(t.memberExpression(t.identifier("document"), t.identifier("createDocumentFragment")), []))),
                // frag.append(...)
                t.expressionStatement(t.callExpression(t.memberExpression(fragId, t.identifier("append")), jsxChildren)),
                // frag
                t.expressionStatement(fragId),
            ]);
        }
    }
};
export default function (_) {
    return mutractPlugin;
}
