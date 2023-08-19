import { getMarker } from "./getMarker.js";
import { memoize } from "./memoize.js";
import { effectOrDo } from "./runtime.trackers.js";

type ConditionalElement = {
    nodeGetter: () => CharacterData;
    conditionGetter?: () => boolean;
}

export function choose(...choices: ConditionalElement[]): Node {
    const lazyChoices: ConditionalElement[] = [];
    let foundUnconditional = false;

    for (const choice of choices) {
        if ("conditionGetter" in choice) {
            lazyChoices.push({
                nodeGetter: memoize(choice.nodeGetter),
                conditionGetter: choice.conditionGetter,
            });
        }
        else {
            lazyChoices.push({ 
                nodeGetter: memoize(choice.nodeGetter),
            });
            foundUnconditional = true;
            break;
        }
    }
    if (!foundUnconditional) {
        const empty = getMarker("if:anti-consequent");
        lazyChoices.push({ nodeGetter: () => empty });
    }

    let current: ChildNode = getMarker("choice-placeholder");
    effectOrDo(() => {
        for (const { nodeGetter, conditionGetter } of choices) {
            if (!conditionGetter || conditionGetter()) {
                const newNode = nodeGetter();
                current.replaceWith(newNode);
                current = newNode;
                break;
            }
        }
    });

    return current;
}