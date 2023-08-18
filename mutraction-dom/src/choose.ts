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
                nodeGetter: memoize(choice.nodeGetter)
            });
            foundUnconditional = true;
        }
        else {
            lazyChoices.push({ 
                nodeGetter: memoize(choice.nodeGetter),
                conditionGetter: choice.conditionGetter,
            });
        }
    }
    if (!foundUnconditional) {
        const empty = getMarker("if:anti-consequent");
        lazyChoices.push({ nodeGetter: () => empty });
    }

    const container = document.createDocumentFragment();
    let result: ChildNode = getMarker("choice-placeholder");
    container.append(result);

    effectOrDo(() => {
        for (const { nodeGetter, conditionGetter } of choices) {
            if (!conditionGetter || conditionGetter()) {
                result.replaceWith(nodeGetter());
            }
        }
    });

    return result;
}