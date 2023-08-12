import * as BabelCoreNamespace from '@babel/core';
import type * as BT from '@babel/types';
import type { PluginObj } from '@babel/core';

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

function jsxId2Id(name: BT.JSXIdentifier | BT.JSXMemberExpression): BT.Identifier | BT.MemberExpression {
    if (name.type === "JSXIdentifier") return t.identifier(name.name);
    return t.memberExpression(jsxId2Id(name.object), t.identifier(name.property.name));
}

function jsxProp(attr: BT.JSXAttribute | BT.JSXSpreadAttribute) : BT.ObjectProperty | BT.SpreadElement {
    const type = attr.type;
    if (type === 'JSXAttribute') {
        if (attr.name.type === 'JSXNamespacedName') 
            throw Error("Unsupported namespace in JSX attribute");

        return t.objectProperty(
            t.identifier(attr.name.name),
            jsxAttrVal2Prop(attr.value));
    }
    else if (type === 'JSXSpreadAttribute') {
        return t.spreadElement(attr.argument);
    }
    throw Error('Unsupported attribute type: ' + type);
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
}
let ctx: MuContext | undefined = undefined;

const mutractPlugin: PluginObj = {
    visitor: {
        Program: {
            enter(path) {
                path.node.sourceType = "module";
                const elementFnName = path.scope.generateUid("mutraction_element");
                const childFnName = path.scope.generateUid("mutraction_child");
                ctx = { elementFnName, childFnName };

                path.node.body.unshift(
                    t.importDeclaration(
                        [
                            t.importSpecifier(t.identifier(elementFnName), t.identifier("element")),
                            t.importSpecifier(t.identifier(childFnName), t.identifier("child")),
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
            const { name } = path.node.openingElement;

            if (name.type === "JSXNamespacedName")
                throw path.buildCodeFrameError("This JSX element type is not supported");

            const props = path.node.openingElement.attributes.map(jsxProp);

            try {
                if (name.type === "JSXIdentifier" && /^[a-z]/.test(name.name)) {
                    // treat as DOM element
                    const jsxChildren: BT.Expression[] = [];
                    for (const child of path.node.children) {
                        const compiled = jsxChild(child);
                        if (compiled) jsxChildren.push(compiled);
                    }
    
                    path.replaceWith(t.callExpression(
                        t.identifier("element"), 
                        [
                            t.stringLiteral(name.name),
                            t.objectExpression(props),
                            ...jsxChildren
                        ]
                    ));
                    return;
                }
    
                // it's a component, these things practically render themselves
                path.replaceWith(t.callExpression(
                    jsxId2Id(name),
                    [ t.objectExpression(props) ]
                ));
            } 
            catch (err) {
                path.buildCodeFrameError(err instanceof Error ? err.message : String(err));
            }
        }
    }
};

export default function(_: Babel): PluginObj {
    return mutractPlugin;
}
