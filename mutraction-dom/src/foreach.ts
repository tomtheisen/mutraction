import { scheduleCleanup } from "./cleanup.js";
import { effect } from "./effect.js"
import { ElementSpan } from './elementSpan.js';
import { Swapper } from "./swapper.js";
import { isNodeOptions, type Subscription, type NodeOptions } from "./types.js";

const suppress = { suppressUntrackedWarning: true };

type ForEachOutput = { container: ElementSpan, subscription?: Subscription, cleanup?: () => void };
type ForEachPersistOutput = { container: ElementSpan, subscription?: Subscription };

function newForEachOutput(): ForEachOutput {
    return { container: new ElementSpan };
}

/**
 * Generates DOM nodes for an array of values.  The resulting nodes track the array indices.
 * Re-ordering the array will cause affected nodes to be re-generated.
 * @see ForEachPersist if you want DOM nodes to follow the array elements through order changes
 * @param array is the input array.  If it's a function returning an array, identity changes to the array itself will be tracked.
 * @param map is the callback function to produce DOM nodes
 * @returns a DOM node you can include in a document
 */
export function ForEach<TIn>(array: TIn[] | (() => TIn[]) | undefined, map: (item: TIn, index: number, array: TIn[]) => (Node | NodeOptions)): Node {
    if (typeof array === "function") return Swapper(() => ForEach(array(), map));

    const result = new ElementSpan();
    const outputs: ForEachOutput[] = [];

    const arrayDefined = array ?? [];
    const lengthSubscription = effect(function forEachLengthEffect(lengthDep, propRef, info) {
        // If we received a "suffix length" with a length change, then change the output array length in a specific way.
        // Ensure that a number of items move with the end of the array.  The number that are anchored to the end is `suffixLength`.
        // This allows efficient insertions and deletions in the middle of the array.
        if (info?.suffixLength) {
            if (arrayDefined.length < outputs.length) {
                const toRemove = outputs.length - arrayDefined.length;
                const removed = outputs.splice(arrayDefined.length - info.suffixLength, toRemove);
                for (const item of removed) {
                    scheduleCleanup(forEachCleanupOutput, item);
                }
            }
            else if (arrayDefined.length > outputs.length) {
                const toInsert = arrayDefined.length - outputs.length;
                const newOutputs = Array(toInsert).fill(null).map(newForEachOutput);
                let insertIndex = outputs.length - info.suffixLength;
                outputs.splice(insertIndex, 0, ...newOutputs);

                const frag = document.createDocumentFragment();
                for (const output of newOutputs) frag.append(output.container.removeAsFragment());
                if (insertIndex === 0) {
                    result.startMarker.parentNode.insertBefore(frag, result.startMarker.nextSibling);
                    throw "NIE TODO check if this is right seems funny";
                }
                else {
                    result.startMarker.parentNode.insertBefore(frag, outputs[insertIndex].container.endMarker.nextSibling)
                    throw "NIE TODO check if this is right seems funny";
                }
            }
        }

        // i is scoped to each loop body invocation
        for (let i = outputs.length; i < arrayDefined.length; i++) {
            const output: ForEachOutput = newForEachOutput();
            outputs.push(output);

            output.subscription = effect(function forEachItemEffect(dep) {
                const item = arrayDefined[i];
                const projection = item !== undefined ? map(item, i, arrayDefined) : document.createTextNode("");
                if (isNodeOptions(projection)) {
                    output.container.replaceWith(projection.node);
                    output.cleanup = projection.cleanup;
                }
                else if (projection != null) {
                    output.container.replaceWith(projection);
                    output.cleanup = undefined;
                }

                return () => {
                    output.cleanup?.();
                    output.container.cleanup();
                };
            }, suppress);

            result.append(output.container.removeAsFragment());
        }

        while (outputs.length > arrayDefined.length) {
            scheduleCleanup(forEachCleanupOutput, outputs.pop()!);
        }
    }, suppress);

    result.registerCleanup({ dispose() { outputs.forEach(forEachCleanupOutput); }});
    result.registerCleanup(lengthSubscription);

    return result.removeAsFragment();
}

function forEachCleanupOutput({ cleanup, container, subscription }: ForEachOutput) {
    cleanup?.();
    subscription?.dispose();
    container.removeAsFragment();
    container.cleanup();
}

/**
 * Generates DOM nodes for an array of objects.  The resulting nodes track the array elements.
 * Re-ordering the array will cause the generated nodes to re-ordered in parallel
 * @param array is the input array of objects.  Primitive element values can't be used. If it's a function returning an array, identity changes to the array itself will be tracked.
 * @param map is the callback function to produce DOM nodes
 * @returns a DOM node you can include in a document
 */
// export function ForEachPersist<TIn extends object>(array: TIn[] | (() => TIn[]) | undefined, map: (e: TIn) => Node): Node {
//     if (typeof array === "function") return Swapper(() => ForEachPersist(array(), map));

//     const result = new ElementSpan();
//     const outputs: ForEachPersistOutput[] = [];
//     const outputMap = new WeakMap<TIn, HTMLElement | ElementSpan>;

//     const arrayDefined = array ?? [];
//     const lengthSubscription = effect(function forEachPersistLengthEffect(lengthDep) {
//         // i is scoped to each loop body invocation
//         for (let i = outputs.length; i < arrayDefined.length; i++) {
//             const output: ForEachPersistOutput = { container: new ElementSpan };
//             outputs.push(output);

//             output.subscription = effect(function forEachPersistItemEffect(dep) {
//                 const item = arrayDefined[i];
//                 if (item == null) return; // probably an array key deletion

//                 if (typeof item !== "object") throw Error("Elements must be object in ForEachPersist");
                
//                 let newContents = outputMap.get(item);
//                 if (newContents == null) {
//                     if (dep) dep.active = false;
//                     try {
//                         const newNode = map(item); // this is the line that might throw
//                         newContents = newNode instanceof HTMLElement ? newNode : new ElementSpan(newNode);
//                         outputMap.set(item, newContents);
//                     }
//                     finally {
//                         if (dep) dep.active = true;
//                     }
//                 }
//                 else {
//                     const connected = newContents instanceof HTMLElement ? newContents.isConnected : newContents.startMarker.isConnected;
//                     if (connected) console.error("ForEachPersist encountered the same object twice in the same array.");
//                 }

//                 if (newContents instanceof HTMLElement) {
//                     output.container.replaceWith(newContents);
//                 }
//                 else if (newContents != null) {
//                     output.container.replaceWith(newContents.removeAsFragment());
//                 }

//                 // just keep the contents together with a parent somewhere
//                 return () => output.container.emptyAsFragment();
//             }, suppress);

//             result.append(output.container.removeAsFragment());
//         }

//         while (outputs.length > arrayDefined.length) {
//             scheduleCleanup(forEachPersistCleanupOutput, outputs.pop()!);
//         }
//     }, suppress);

//     result.registerCleanup({ dispose() { outputs.forEach(forEachPersistCleanupOutput); } })
//     result.registerCleanup(lengthSubscription);

//     return result.removeAsFragment();
// }

// function forEachPersistCleanupOutput(output: ForEachPersistOutput) {
//     const { container, subscription } = output;
//     subscription?.dispose();
//     container.removeAsFragment();
//     container.cleanup();
// }
