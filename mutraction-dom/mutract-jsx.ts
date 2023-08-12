import * as BabelCoreNamespace from '@babel/core';
import type * as BT from '@babel/types';
import type { PluginObj } from '@babel/core';

export type Babel = typeof BabelCoreNamespace;
export type BabelTypes = typeof BT;

const Visited = Symbol("Visited");

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
            t.identifier("child"), 
            [ 
                t.arrowFunctionExpression([], child.expression)
            ]
        );
    }
    else if (type === "JSXFragment") {
        return t.stringLiteral("NIE fragment")
    }
    else if (type === "JSXSpreadChild") {
        return t.stringLiteral("NIE spread child")
    }
    throw Error("Unsupported child type " + type);
}

function toReference(name: BT.JSXIdentifier | BT.JSXMemberExpression): BT.Identifier | BT.MemberExpression {
    if (name.type === "JSXIdentifier") return t.identifier(name.name);
    return t.memberExpression(toReference(name.object), t.identifier(name.property.name));
}

export default function({ types: t }: Babel): PluginObj {
    return {
        visitor: {
            // BinaryExpression(path) {
            //     if (path.node.operator !== "===") return;
            //     path.node.left = t.identifier("sebmck");
            //     path.node.right = t.identifier("dork");
            // },
            JSXElement(path) {
                let name = path.node.openingElement.name;
                let id = "";

                if (name.type === "JSXIdentifier" && /^[a-z]/.test(name.name)) {
                    // is DOM (host) element

                    const jsxChildren: BT.Expression[] = [];
                    for (const child of path.node.children) {
                        const compiled = jsxChild(child);
                        if (compiled) jsxChildren.push(compiled);
                    }

                    path.replaceWith(t.callExpression(
                        t.identifier("element"), 
                        [
                            t.stringLiteral(name.name),
                            t.objectExpression([]), // TODO props
                            ...jsxChildren
                        ]
                    ));
                    return;
                }

                if (name.type === "JSXNamespacedName")
                    throw Error("This JSX element type is not supported");

                // it's a component, these things practically render themselves
                return t.callExpression(
                    toReference(name),
                    [
                        t.objectExpression([]), // TODO props
                    ]
                );
            }
        }
    };
}