import { effect } from "./effect.js";
import { getMarker } from "./getMarker.js";
import { memoize } from "./memoize.js";
import { defaultTracker } from "./tracker.js";

type ConditionalElement = {
    nodeGetter: () => CharacterData;
    conditionGetter?: () => boolean;
}

const suppress = { suppressUntrackedWarning: true } as const;

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
    effect(() => {
        for (const { nodeGetter, conditionGetter } of lazyChoices) {
            if (!conditionGetter || conditionGetter()) {
                const newNode = nodeGetter();
                current.replaceWith(newNode);
                current = newNode;
                break;
            }
        }
    }, suppress);

    return current;
}