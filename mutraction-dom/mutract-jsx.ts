import type * as BabelCoreNamespace from '@babel/core';
import type * as BabelTypesNamespace from '@babel/types';
import type { PluginObj } from '@babel/core';

export type Babel = typeof BabelCoreNamespace;
export type BabelTypes = typeof BabelTypesNamespace;

export default function({ types: t }: Babel): PluginObj {
    return {
        visitor: {
            BinaryExpression(path) {
                if (path.node.operator !== "===") return;
                path.node.left = t.identifier("sebmck");
                path.node.right = t.identifier("dork");
            },
            JSXElement(path) {
                // path.insertBefore(t.commentBlock("xformed")));
                // console.log(path.node);
                const node = path.node as any;
                if (node.tjt_parenthesized) return;
                node.tjt_parenthesized = true;
                path.replaceWith(t.parenthesizedExpression(path.node));
                // path.stop();
            }
        }
    };
}