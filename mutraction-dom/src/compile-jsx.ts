import * as B from '@babel/core';
import type * as BT from '@babel/types';
import type { PluginObj } from '@babel/core';
import { track } from 'mutraction';

export type Babel = typeof B;
export type BabelTypes = typeof BT;

const t = B.types;
function jsxChild(ctx: MuContext, child: 
    BT.JSXText | 
    BT.JSXExpressionContainer | 
    BT.JSXSpreadChild | 
    BT.JSXElement | 
    BT.JSXFragment
): BT.Expression | null {
    const type = child.type;
    if (type === "JSXText") {
        const value = child.value.trim();
        if (value === "") return null;
        return t.stringLiteral(value);
    }
    else if (type === "JSXElement") {
        return child;
    }
    else if (type === "JSXExpressionContainer") {
        if (child.expression.type === "JSXEmptyExpression") return null;
        return t.callExpression(
            t.identifier(ctx.childFnName), 
            [ t.arrowFunctionExpression([], child.expression) ]
        );
    }
    else if (type === "JSXFragment") {
        return child;
    }
    else if (type === "JSXSpreadChild") {
        return t.stringLiteral("NIE spread child");
    }
    throw Error("Unsupported child type " + type);
}

function jsxAttrVal2Prop(attrVal: 
    BT.JSXExpressionContainer |
    BT.JSXElement |
    BT.JSXFragment |
    BT.StringLiteral |
    null | undefined
): [isDynamic: boolean, expr: BT.Expression] {
    // bare attribute e.b. <input disabled />
    if (!attrVal) return [false, t.booleanLiteral(true)];

    if (attrVal.type === 'StringLiteral') {
        return [false, t.stringLiteral(attrVal.value)];
    }
    else if (attrVal.type === 'JSXExpressionContainer') {
        if (attrVal.expression.type === 'JSXEmptyExpression') return [false, t.booleanLiteral(true)];
        return [true, attrVal.expression];
    }
    else {
        return [false, attrVal]; // process later / TODO?
    }
}

function jsxId2Id(name: BT.JSXIdentifier | BT.JSXMemberExpression): BT.Identifier | BT.MemberExpression {
    if (name.type === "JSXIdentifier") return t.identifier(name.name);
    return t.memberExpression(jsxId2Id(name.object), t.identifier(name.property.name));
}

type MuContext = {
    elementFnName: string;
    childFnName: string;
    setTrackerFnName: string;
    clearTrackerFnName: string;
}

function isProgram(path: B.NodePath | null): path is B.NodePath<BT.Program> {
    return path?.node.type === "Program";
}

let _ctx: MuContext | undefined = undefined;
function clearImports() {
    _ctx = undefined;
}
function ensureImportsCreated(path: B.NodePath) {
    const programPath = path.findParent(isProgram);
    if (!isProgram(programPath)) 
        throw Error ("Can't create imports outside of a program.");

    if (_ctx) return _ctx;

    programPath.node.sourceType = "module";
    const elementFnName = programPath.scope.generateUid("mu_element");
    const childFnName = programPath.scope.generateUid("mu_child");
    const setTrackerFnName = programPath.scope.generateUid("mu_setTracker");
    const clearTrackerFnName = programPath.scope.generateUid("mu_clearTracker");

    programPath.node.body.unshift(
        t.importDeclaration(
            [
                t.importSpecifier(t.identifier(elementFnName), t.identifier("element")),
                t.importSpecifier(t.identifier(childFnName), t.identifier("child")),
                t.importSpecifier(t.identifier(setTrackerFnName), t.identifier("setTracker")),
                t.importSpecifier(t.identifier(clearTrackerFnName), t.identifier("clearTracker")),
            ],
            t.stringLiteral("mutraction-dom")
        )
    );

    return _ctx = { elementFnName, childFnName, setTrackerFnName, clearTrackerFnName };
}

function isMutractionNamespace(ns: BT.JSXIdentifier): boolean {
    return ns.name === "mu" || ns.name ==="µ";
}

/** AST node where mu:tracker is defined, if in scope */
let trackerDefinitionJsxNode: B.Node | undefined = undefined;

const mutractPlugin: PluginObj = {
    visitor: {
        Program: {
            enter(path) { },
            exit(path) {
                clearImports();
            }
        },
        JSXElement: {
            enter(path) {
                const ctx = ensureImportsCreated(path);

                const { name } = path.node.openingElement;

                if (name.type === "JSXNamespacedName")
                    throw path.buildCodeFrameError("JSXNamespacedName JSX element type is not supported");

                let trackerExpression: BT.Expression | undefined = undefined;

                // look for tracker attribute
                for (const attr of path.node.openingElement.attributes) {
                    if (attr.type === 'JSXAttribute' && attr.name.type === 'JSXNamespacedName') {
                        const { name, value } = attr;

                        if (!isMutractionNamespace(name.namespace))
                            throw Error(`Unsupported namespace ${ name.namespace.name } in JSX attribute`);
                        
                        if (name.name.name === "tracker") {
                            if (value?.type !== "JSXExpressionContainer") 
                                throw Error(`Expression value expected for '${ name.name.name }'`);

                            if (value.expression.type === "JSXEmptyExpression") break;

                            if (trackerDefinitionJsxNode)
                                throw Error('Cannot nest dom mu:tracker properties');

                            trackerDefinitionJsxNode = path.node;
                            trackerExpression = value.expression;
                        }
                    }
                }

                // build props and look for tracker attribute
                const staticPropsForRuntime: (BT.ObjectProperty | BT.SpreadElement)[] = []
                const dynamicPropsForRuntime: BT.ObjectProperty[] = [];

                for (const attr of path.node.openingElement.attributes) {
                    switch (attr.type) {
                        case 'JSXAttribute':
                            switch (attr.name.type) {
                                case 'JSXNamespacedName': {
                                    const { name, value } = attr;

                                    if (!isMutractionNamespace(name.namespace))
                                        throw Error(`Unsupported namespace ${ name.namespace.name } in JSX attribute`);
                                    
                                    switch (name.name.name) { // lol babel
                                        case "tracker":
                                            // already handled
                                            break;

                                        case "if":
                                            if (value?.type !== "JSXExpressionContainer") 
                                            throw Error(`Expression value expected for '${ name.name.name }'`);

                                            if (value.expression.type === "JSXEmptyExpression")
                                                break;

                                            const [isDynamic, expr] = jsxAttrVal2Prop(value);
                                            if (isDynamic && trackerDefinitionJsxNode) {
                                                dynamicPropsForRuntime.push(
                                                    t.objectProperty(
                                                        t.stringLiteral("mu:if"),
                                                        t.arrowFunctionExpression([], expr)
                                                    )
                                                );
                                            }
                                            else {
                                                staticPropsForRuntime.push(
                                                    t.objectProperty(t.stringLiteral("mu:if"), expr)
                                                );
                                            }
                                            break;

                                        default:
                                            throw Error(`Unsupported mutraction JSX attribute ${ name.name.name }`);
                                    }
                                    break;
                                }

                                case 'JSXIdentifier': {
                                    const { name, value } = attr;
                                    const [isDynamic, expr] = jsxAttrVal2Prop(value);
                                    if (isDynamic && trackerDefinitionJsxNode) {
                                        dynamicPropsForRuntime.push(
                                            t.objectProperty(
                                                t.identifier(name.name),
                                                t.arrowFunctionExpression([], expr)
                                            )
                                        );
                                    }
                                    else {
                                        staticPropsForRuntime.push(
                                            t.objectProperty(t.identifier(name.name), expr)
                                        );
                                    }
                                    break;
                                }
                            }
                            break;

                        case 'JSXSpreadAttribute':
                            throw Error('JSX spread not supported.');

                        default:
                            throw Error('Unsupported attribute type.');
                    }
                }

                let renderFunc: BT.CallExpression | undefined = undefined;

                if (name.type === "JSXIdentifier" && /^[a-z]/.test(name.name)) {
                    // treat as DOM element
                    const jsxChildren: BT.Expression[] = [];
                    for (const child of path.node.children) {
                        const compiled = jsxChild(ctx, child);
                        if (compiled) jsxChildren.push(compiled);
                    }

                    renderFunc = t.callExpression(
                        t.identifier(ctx.elementFnName), 
                        [
                            t.stringLiteral(name.name),
                            t.objectExpression(staticPropsForRuntime),
                            t.objectExpression(dynamicPropsForRuntime),
                            ...jsxChildren
                        ]
                    );
                }
                else { // JSXMemberExpression or upper-case function component
                    throw Error("Embed function 'components' with curly braces, not jsx.");
                }

                if (trackerExpression) {
                    const trackedRoot =  t.memberExpression(
                        t.arrayExpression([
                            t.callExpression(t.identifier(ctx.setTrackerFnName), [trackerExpression]),
                            renderFunc,
                            t.callExpression(t.identifier(ctx.clearTrackerFnName), [])
                        ]),
                        t.numericLiteral(1),
                        true /* computed */
                    );
                    path.replaceWith(trackedRoot);
                }
                else {
                    path.replaceWith(renderFunc);
                }
            },
            exit(path) {
                if (path.node === trackerDefinitionJsxNode) {
                    trackerDefinitionJsxNode = undefined;
                }
            }
        },
        JSXFragment(path) {
            const ctx = ensureImportsCreated(path);

            const jsxChildren: BT.Expression[] = [];
            for (const child of path.node.children) {
                const compiled = jsxChild(ctx, child);
                if (compiled) jsxChildren.push(compiled);
            }

            const fragId = path.scope.generateDeclaredUidIdentifier("frag");
            path.replaceExpressionWithStatements([
                // frag = document.createDocumentFragment()
                t.expressionStatement(
                    t.assignmentExpression(
                        "=",
                        fragId,
                        t.callExpression(
                            t.memberExpression(
                                t.identifier("document"),
                                t.identifier("createDocumentFragment")
                            ),
                            []
                        )
                    )
                ),
                // frag.append(...)
                t.expressionStatement(
                    t.callExpression(
                        t.memberExpression(
                            fragId,
                            t.identifier("append")
                        ),
                        jsxChildren
                    )
                ),
                // frag
                t.expressionStatement(fragId),
            ]);
        }
    }
};

export default function(_: Babel): PluginObj {
    return mutractPlugin;
}
