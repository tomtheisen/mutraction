import type { Transaction } from "./types.js";

/**
 * Simplify the operations in a committed transaction, with no change in observable behavior
 *  - unwrap inner transactions
 *  - collapse adjacent pairs of mutations on the same property
 *  - remove no-op changes
 */
export function compactTransaction({ operations }: Transaction): void {
    for (let i = 0; i < operations.length;) {
        const currOp = operations[i];
        if (currOp.type === "transaction") {
            operations.splice(i, 1, ...currOp.operations);
        }
        else if (currOp.type === "change" && Object.is(currOp.oldValue, currOp.newValue)) {
            operations.splice(i, 1);
        }
        else if (i > 0) {
            const prevOp = operations[i - 1];
            if (prevOp.type === "transaction") {
                throw Error("Internal mutraction error.  Found internal transaction on look-back during packTransaction.");
            }
            else if (prevOp.target !== currOp.target || prevOp.name !== currOp.name) {
                ++i;
            }
            else if (prevOp.type === "create" && currOp.type === "change") {
                operations.splice(--i, 2, { ...prevOp, newValue: currOp.newValue });
            }
            else if (prevOp.type === "create" && currOp.type === "delete") {
                operations.splice(--i, 2); // together it's a no-op
            }
            else if (prevOp.type === "change" && currOp.type === "change") {
                operations.splice(--i, 2, { ...prevOp, newValue: currOp.newValue });
            }
            else if (prevOp.type === "change" && currOp.type === "delete") {
                operations.splice(--i, 2, { ...currOp, oldValue: prevOp.oldValue });
            }
            else if (prevOp.type === "delete" && currOp.type === "create") {
                operations.splice(--i, 2, { ...currOp, ...prevOp, type: "change" });
            }
            else ++i;
        }
        else ++i;
    }
}
