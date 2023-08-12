export declare namespace JSX {
    interface StandardElement {
        ref?: string;
        class?: string;
    }
    export type IntrinsicElements = {
        [key in keyof HTMLElementTagNameMap]: StandardElement & Partial<HTMLElementTagNameMap[key]>;
    };
    export {};
}
import * as BabelCoreNamespace from '@babel/core';
import type * as BT from '@babel/types';
import type { PluginObj } from '@babel/core';
export type Babel = typeof BabelCoreNamespace;
export type BabelTypes = typeof BT;
export default function (_: Babel): PluginObj;
