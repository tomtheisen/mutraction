import { cleanup, registerCleanup } from "./cleanup.js";
import { effect } from "./effect.js";

type ConditionalElement = {
    nodeGetter: () => ChildNode;
    conditionGetter?: () => boolean;
}

const suppress = { suppressUntrackedWarning: true } as const;

function getEmptyText() {
    return document.createTextNode("");
}

export function choose(...choices: ConditionalElement[]): Node {
    let current: ChildNode | undefined;
    let currentNodeGetter: () => ChildNode;   

    // count is incremented when condition value caused the resolved node to change.
    // The effect needs to be disposed when the node is cleaned up, but only when there's no pending change cleanup.
    let changeCount = 0;
    function dispose() {
        if (changeCount === 0) sub.dispose();
        else --changeCount;
    }

    const sub = effect(function chooseEffect() {
        let newNodeGetter: (() => ChildNode) | undefined;
        for (const { nodeGetter, conditionGetter } of choices) {
            if (!conditionGetter || conditionGetter()) {
                newNodeGetter = nodeGetter;
                break;
            }
        }
        newNodeGetter ??= getEmptyText;

        // maybe the condition dependency changed, but not the truthiness of the condition itself.
        // e.g. `model.x > 1` stays true when model.x changes from 2 to 3
        // but we don't want to rebuild the node
        if (newNodeGetter !== currentNodeGetter) {
            if (current) {
                ++changeCount;
                cleanup(current);
            }

            currentNodeGetter = newNodeGetter;
            const newNode = currentNodeGetter();
            current?.replaceWith(newNode);

            registerCleanup(newNode, { dispose });
            current = newNode;
        }
    }, suppress);

    if (!current) throw Error("Logical error in choose() for mu:if.  No element assigned after first effect invocation.");
    return current;
}