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
    let current: ChildNode = getEmptyText(); 
    let currentNodeGetter: () => ChildNode = getEmptyText;   
    
    // Flag is set when condition value caused the resolved node to change.
    // The effect needs to be disposed when the node is cleaned up, but only without the flag.
    let conditionChanging = false;
    function dispose() {
        if (!conditionChanging) sub.dispose();
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
            conditionChanging = true;
            cleanup(current);
            conditionChanging = false;

            currentNodeGetter = newNodeGetter;
            const newNode = currentNodeGetter();
            current.replaceWith(newNode);

            registerCleanup(newNode, { dispose });
            current = newNode;
        }
    }, suppress);

    return current;
}