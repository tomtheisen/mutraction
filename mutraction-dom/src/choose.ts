import { cleanup } from "./cleanup.js";
import { effect } from "./effect.js";

type ConditionalElement = {
    nodeGetter: () => ChildNode;
    conditionGetter?: () => boolean;
}

const suppress = { suppressUntrackedWarning: true } as const;

export function choose(...choices: ConditionalElement[]): Node {
    let current: ChildNode = document.createTextNode("");
    
    effect(function chooseEffect() {
        let match = false;
        for (const { nodeGetter, conditionGetter } of choices) {
            if (!conditionGetter || conditionGetter()) {
                match = true;
                cleanup(current);
                const newNode = nodeGetter();
                current.replaceWith(newNode);
                current = newNode;
                break;
            }
        }
        if (!match) {
            cleanup(current);
            const newNode = document.createTextNode("");
            current.replaceWith(newNode);
            current = newNode;
        }
    }, suppress);

    return current;
}