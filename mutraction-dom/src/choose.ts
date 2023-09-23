import { cleanup } from "./cleanup.js";
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
    
    // this effect subscription probably doesn't need to be disposed
    // since mu:if/mu:else can only be applied to HTMLElement, which has its own cleanup
    // in other words, we expect that nodeGetter() always directly calls element()
    effect(function chooseEffect() {
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
            cleanup(current);

            currentNodeGetter = newNodeGetter;
            const newNode = currentNodeGetter();
            current.replaceWith(newNode);
            current = newNode;
        }
    }, suppress);

    return current;
}