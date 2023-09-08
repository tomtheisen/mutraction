import { effect } from "./effect.js";
import { memoize } from "./memoize.js";
import { ScopeTypes, getScopedValue } from "./scope.js";

type ConditionalElement = {
    nodeGetter: () => CharacterData;
    conditionGetter?: () => boolean;
}

const suppress = { suppressUntrackedWarning: true } as const;

export function choose(...choices: ConditionalElement[]): Node {
    const lazyChoices: ConditionalElement[] = [];
    const errorBoundary = getScopedValue(ScopeTypes.errorBoundary);
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
        const empty = document.createTextNode("");
        lazyChoices.push({ nodeGetter: () => empty });
    }

    let current: ChildNode = document.createTextNode("");
    effect(() => {
        for (const { nodeGetter, conditionGetter } of lazyChoices) {
            if (!conditionGetter || conditionGetter()) {
                function doReplace() {
                    const newNode = nodeGetter();
                    current.replaceWith(newNode);
                    current = newNode;
                }
                
                if (errorBoundary) {
                    try { doReplace(); }
                    catch (err) { errorBoundary(err); }
                }
                else {
                    doReplace();
                }
                break;
            }
        }
    }, suppress);

    return current;
}