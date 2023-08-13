import * as BabelCoreNamespace from '@babel/core';
import type * as BT from '@babel/types';
import type { PluginObj } from '@babel/core';
import { track } from 'mutraction';

export type Babel = typeof BabelCoreNamespace;
export type BabelTypes = typeof BT;

const t = BabelCoreNamespace.types;
function jsxChild(child: 
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
            t.identifier(ctx!.childFnName), 
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

function jsxId2Id(name: BT.JSXIdentifier | BT.JSXMemberExpression): BT.Identifier | BT.MemberExpression {
    if (name.type === "JSXIdentifier") return t.identifier(name.name);
    return t.memberExpression(jsxId2Id(name.object), t.identifier(name.property.name));
}

function jsxAttrVal2Prop(attrVal: 
    BT.JSXExpressionContainer |
    BT.JSXElement |
    BT.JSXFragment |
    BT.StringLiteral |
    null | undefined
): BT.Expression {
    // bare attribute e.b. <input disabled />
    if (!attrVal) return t.booleanLiteral(true);

    const type = attrVal.type;
    if (type === 'StringLiteral') {
        return t.stringLiteral(attrVal.value);
    }
    else if (type === 'JSXExpressionContainer') {
        if (attrVal.expression.type === 'JSXEmptyExpression') return t.booleanLiteral(true);
        return t.arrowFunctionExpression([], attrVal.expression)
    }
    else {
        return attrVal; // process later / TODO?
    }
}

type MuContext = {
    elementFnName: string;
    childFnName: string;
    setTrackerFnName: string;
    clearTrackerFnName: string;
}
let ctx: MuContext | undefined = undefined;

const mutractPlugin: PluginObj = {
    visitor: {
        Program: {
            enter(path) {
                path.node.sourceType = "module";
                const elementFnName = path.scope.generateUid("mu_element");
                const childFnName = path.scope.generateUid("mu_child");
                const setTrackerFnName = path.scope.generateUid("mu_setTracker");
                const clearTrackerFnName = path.scope.generateUid("mu_clearTracker");
                ctx = { elementFnName, childFnName, setTrackerFnName, clearTrackerFnName };

                path.node.body.unshift(
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
            },
            exit(path) {
                ctx = undefined;
            }
        },
        JSXElement(path) {
            if (!ctx) throw Error("Unable to find program start to add imports");

            const { name } = path.node.openingElement;

            if (name.type === "JSXNamespacedName")
                throw path.buildCodeFrameError("This JSX element type is not supported");

            let trackerExpression: BT.Expression | undefined = undefined;

            // build props and look for tracker attribute
            const props: (BT.ObjectProperty | BT.SpreadElement)[] = [];
            for (const attr of path.node.openingElement.attributes) {
                switch (attr.type) {
                    case 'JSXAttribute':
                        if (attr.name.type === 'JSXNamespacedName') 
                            throw Error("Unsupported namespace in JSX attribute");
                        
                        if (attr.name.name === "tracker" 
                            && attr.value?.type === "JSXExpressionContainer" 
                            && attr.value.expression.type !== "JSXEmptyExpression"
                        ) {
                            trackerExpression = attr.value.expression;
                        }
                        else {
                            props.push(t.objectProperty(
                                t.identifier(attr.name.name),
                                jsxAttrVal2Prop(attr.value)));
                        }
                        break;
                    case 'JSXSpreadAttribute':
                        props.push(t.spreadElement(attr.argument));
                        break;
                    default:
                        throw Error('Unsupported attribute type.');
                }
            }

            let renderFunc: BT.CallExpression | undefined = undefined;

            if (name.type === "JSXIdentifier" && /^[a-z]/.test(name.name)) {
                // treat as DOM element
                const jsxChildren: BT.Expression[] = [];
                for (const child of path.node.children) {
                    const compiled = jsxChild(child);
                    if (compiled) jsxChildren.push(compiled);
                }

                renderFunc = t.callExpression(
                    t.identifier(ctx!.elementFnName), 
                    [
                        t.stringLiteral(name.name),
                        t.objectExpression(props),
                        ...jsxChildren
                    ]
                );
            }
            else { // JSXMemberExpression or upper-case function component
                renderFunc = t.callExpression(
                    jsxId2Id(name),
                    [ t.objectExpression(props) ]
                );
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
        JSXFragment(path) {
            if (!ctx) throw Error("Unable to find program start to add imports");

            const jsxChildren: BT.Expression[] = [];
            for (const child of path.node.children) {
                const compiled = jsxChild(child);
                if (compiled) jsxChildren.push(compiled);
            }

            // path.scope.addGlobal(t.identifier("document"));
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
