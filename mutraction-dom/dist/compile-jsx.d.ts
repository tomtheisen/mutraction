import type * as B from '@babel/core';
import type * as BT from '@babel/types';
import type { PluginObj } from '@babel/core';
export type Babel = typeof B;
export type BabelTypes = typeof BT;
export default function (_: Babel): PluginObj;
