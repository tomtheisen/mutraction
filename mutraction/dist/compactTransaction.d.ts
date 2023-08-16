import type { Transaction } from "./types.js";
/**
 * Simplify the operations in a committed transaction, with no change in observable behavior
 *  - unwrap inner transactions
 *  - collapse adjacent pairs of mutations on the same property
 *  - remove no-op changes
 */
export declare function compactTransaction({ operations }: Transaction): void;
