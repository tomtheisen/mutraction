import * as B from '@babel/core';
import type * as BT from '@babel/types';
import type { PluginObj } from '@babel/core';

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
    else if (type === "JSXSpreadChild") {
        return t.stringLiteral("NIE spread child");
    }
    else {
        // some of these children have already been transformed into unexpected types
        // probably function calls
        return child;
    }
}

/**
 * extracts an expression from a jsx attribute
 * @param attrVal 
 * @returns 2-tuple [isDynamic, expression] containing
 *      * isDynamic - whether it's a curly brace expression
 *      * expression - the AST node for the expression
 */
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

type MuContext = {
    elementFnName: string;
    childFnName: string;
    chooseFnName: string;
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
        throw path.buildCodeFrameError("Can't create imports outside of a program.");

    if (_ctx) return _ctx;

    programPath.node.sourceType = "module";
    const elementFnName = programPath.scope.generateUid("mu_element");
    const childFnName = programPath.scope.generateUid("mu_child");
    const chooseFnName = programPath.scope.generateUid("mu_choose");
    const setTrackerFnName = programPath.scope.generateUid("mu_setTracker");
    const clearTrackerFnName = programPath.scope.generateUid("mu_clearTracker");

    programPath.node.body.unshift(
        t.importDeclaration(
            [
                t.importSpecifier(t.identifier(elementFnName), t.identifier("element")),
                t.importSpecifier(t.identifier(childFnName), t.identifier("child")),
                t.importSpecifier(t.identifier(chooseFnName), t.identifier("choose")),
                t.importSpecifier(t.identifier(setTrackerFnName), t.identifier("setTracker")),
                t.importSpecifier(t.identifier(clearTrackerFnName), t.identifier("clearTracker")),
            ],
            t.stringLiteral("mutraction-dom")
        )
    );

    return _ctx = { elementFnName, childFnName, chooseFnName, setTrackerFnName, clearTrackerFnName };
}

function isMutractionNamespace(ns: BT.JSXIdentifier): boolean {
    return ns.name === "mu" || ns.name ==="µ";
}

/** runtime choose call for mu:if and mu:else - this is where else expressions will be appended */
const activeChooseForJsxParent: Map<BT.Node, BT.CallExpression> = new Map;

function JSXElement_exit(this: B.PluginPass, path: B.NodePath<BT.JSXElement>) {
    const ctx = ensureImportsCreated(path);

    const { name } = path.node.openingElement;

    if (name.type === "JSXNamespacedName")
        throw path.buildCodeFrameError("JSXNamespacedName JSX element type is not supported");

    let trackerExpression: BT.Expression | undefined = undefined;
    let ifExpression: BT.Expression | undefined = undefined;
    let hasElse = false;

    // build props and look for tracker attribute
    const staticPropsForRuntime: (BT.ObjectProperty | BT.SpreadElement)[] = []
    const dynamicPropsForRuntime: BT.ObjectProperty[] = [];

    for (const attr of path.node.openingElement.attributes) {
        switch (attr.type) {
            case 'JSXAttribute':
                switch (attr.name.type) {
                    case 'JSXNamespacedName': {
                        // probably mu: directive
                        const { name, value } = attr;

                        if (!isMutractionNamespace(name.namespace))
                            throw path.buildCodeFrameError(`Unsupported namespace ${ name.namespace.name } in JSX attribute`);
                        
                        switch (name.name.name) { // lol babel
                            case "tracker":
                                if (value?.type !== "JSXExpressionContainer")
                                throw path.buildCodeFrameError(`Expression value expected for '${name.name.name}'`);
            
                                if (value.expression.type !== "JSXEmptyExpression") {
                                    trackerExpression = value.expression;
                                }                                
                                break;

                            case "if":
                                if (value?.type !== "JSXExpressionContainer") 
                                    throw path.buildCodeFrameError(`Expression value expected for '${ name.name.name }'`);

                                if (value.expression.type === "JSXEmptyExpression")
                                    break;

                                const [isDynamic, expr] = jsxAttrVal2Prop(value);
                                ifExpression = expr;
                                break;

                            case "else":
                                if (value)
                                    throw path.buildCodeFrameError("mu:else not take a value.  Maybe you want <foo mu:else mu:if={...} />?");
                                hasElse = true;
                                break;
                                
                            default:
                                throw path.buildCodeFrameError(`Unsupported mutraction JSX attribute ${ name.name.name }`);
                        }
                        break;
                    }

                    case 'JSXIdentifier': {
                        // probably standard DOM attribute
                        const { name, value } = attr;
                        const [isDynamic, expr] = jsxAttrVal2Prop(value);
                        if (isDynamic) {
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
                throw path.buildCodeFrameError('JSX spread not supported.');

            default:
                throw path.buildCodeFrameError('Unsupported attribute type.');
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
        throw path.buildCodeFrameError("Embed function 'components' with curly braces, not jsx.");
    }

    // handle mu:if and mu:else
    if (hasElse) {
        const chooseCall = activeChooseForJsxParent.get(path.parent);
        if (!chooseCall) {
            throw path.buildCodeFrameError("Elements with mu:else must immediately follow one with mu:if");
        }

        // type of chooseCall arg
        /*
        *  type ConditionalElement = {
        *      nodeGetter: () => CharacterData;
        *      conditionGetter?: () => boolean;
        *  }
        */
        let newChooseArg : BT.ObjectExpression;
        if (ifExpression) {
            newChooseArg = t.objectExpression([
                t.objectProperty(
                    t.identifier("nodeGetter"),
                    t.arrowFunctionExpression([], renderFunc)
                ),
                t.objectProperty(
                    t.identifier("conditionGetter"),
                    t.arrowFunctionExpression([], ifExpression)
                )
            ]);
        }
        else {
            activeChooseForJsxParent.delete(path.parent); // this chain is broken
            newChooseArg = t.objectExpression([
                t.objectProperty(
                    t.identifier("nodeGetter"),
                    t.arrowFunctionExpression([], renderFunc)
                )
            ]);
        }
        chooseCall.arguments.push(newChooseArg);
        path.remove();
        return; // don't attempt to replace later
    }
    else if (ifExpression) {
        renderFunc = t.callExpression(
            t.identifier(ctx.chooseFnName),
            [
                t.objectExpression([
                    t.objectProperty(
                        t.identifier("nodeGetter"),
                        t.arrowFunctionExpression([], renderFunc)
                    ),
                    t.objectProperty(
                        t.identifier("conditionGetter"),
                        t.arrowFunctionExpression([], ifExpression)
                    )
                ])
            ]
        );
        activeChooseForJsxParent.set(path.parent, renderFunc);
    }

    if (trackerExpression) {
        // e.g. [setTracker(...), element(...), clearTracker()][1]
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
}

function JSXFragment_exit(path: B.NodePath<BT.JSXFragment>) {
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

const mutractPlugin: PluginObj = {
    visitor: {
        Program: {
            exit(path) { clearImports(); }
        },
        JSXElement: {
            exit: JSXElement_exit,
        },
        JSXFragment: {
            exit: JSXFragment_exit,
        }
    }
};

export default function(_: Babel): PluginObj {
    return mutractPlugin;
}
