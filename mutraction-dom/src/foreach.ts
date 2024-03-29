import { cleanupNode, scheduleCleanup } from "./cleanup.js";
import { effect } from "./effect.js"
import { ElementSpan } from './elementSpan.js';
import { Swapper } from "./swapper.js";
import { isNodeOptions, type Subscription, type NodeOptions } from "./types.js";

const suppress = { suppressUntrackedWarning: true };

type Output = { container: ElementSpan, subscription?: Subscription, cleanup?: () => void };

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
    const outputs: Output[] = [];

    const arrayDefined = array ?? [];
    const lengthSubscription = effect(function forEachLengthEffect(lengthDep) {
        // i is scoped to each loop body invocation
        for (let i = outputs.length; i < arrayDefined.length; i++) {
            const output: Output = { container: new ElementSpan() };
            outputs.push(output);

            output.subscription = effect(function forEachItemEffect(dep) {
                output.container.empty();

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

                return output.cleanup;
            }, suppress);

            result.append(output.container.removeAsFragment());
        }

        if (outputs.length > 0 && arrayDefined.length === 0) {
            const parent = result.startMarker.parentElement;
            if (parent?.firstChild === result.startMarker && parent.lastChild === result.endMarker) {
                // special case optimization for an emptied array with no element siblings in the container
                const frag = document.createDocumentFragment();
                // remove all the child nodes, but keep them in a fragment so the ElementSpans can be iterated over
                frag.append(...parent.childNodes);
                // put only the outermost span markers back
                parent.append(result.startMarker, result.endMarker);
                for (const output of outputs) scheduleCleanup(cleanupOutput, output)
                outputs.length = 0;
            }
        }
        while (outputs.length > arrayDefined.length) {
            const output = outputs.pop()!;
            output.container.removeAsFragment();
            scheduleCleanup(cleanupOutput, output);
        }
    }, suppress);

    result.registerCleanup({ dispose() { outputs.forEach(cleanupOutput); }});
    result.registerCleanup(lengthSubscription);

    return result.removeAsFragment();
}

function cleanupOutput({ cleanup, container, subscription }: Output) {
    cleanup?.();
    subscription?.dispose();
    container.cleanup();
}

/**
 * Generates DOM nodes for an array of objects.  The resulting nodes track the array elements.
 * Re-ordering the array will cause the generated nodes to re-ordered in parallel
 * @param array is the input array of objects.  Primitive element values can't be used. If it's a function returning an array, identity changes to the array itself will be tracked.
 * @param map is the callback function to produce DOM nodes
 * @returns a DOM node you can include in a document
 * @deprecated Use ForEach instead
 */
export function ForEachPersist<TIn extends object>(array: TIn[] | (() => TIn[]) | undefined, map: (e: TIn) => Node): Node {
    if (typeof array === "function") return Swapper(() => ForEachPersist(array(), map));

    const result = new ElementSpan();
    const containers: ElementSpan[] = [];
    const outputMap = new WeakMap<TIn, HTMLElement | ElementSpan>;

    const arrayDefined = array ?? [];
    const lengthSubscription = effect(function forEachPersistLengthEffect(lengthDep) {
        // i is scoped to each loop body invocation
        for (let i = containers.length; i < arrayDefined.length; i++) {
            const container = new ElementSpan;
            containers.push(container);

            effect(function forEachPersistItemEffect(dep) {
                // just keep the contents together with a parent somewhere
                // but do not run cleanup
                container.contentsRemoved();

                const item = arrayDefined[i];
                if (item == null) return; // probably an array key deletion

                if (typeof item !== "object") throw Error("Elements must be object in ForEachPersist");
                
                let newContents = outputMap.get(item);
                if (newContents == null) {
                    if (dep) dep.active = false;
                    try {
                        const newNode = map(item); // this is the line that might throw
                        newContents = newNode instanceof HTMLElement ? newNode : new ElementSpan(newNode);
                        outputMap.set(item, newContents);
                    }
                    finally {
                        if (dep) dep.active = true;
                    }
                }

                if (newContents instanceof HTMLElement) {
                    container.replaceWith(newContents);
                }
                else if (newContents != null) {
                    container.replaceWith(newContents.removeAsFragment());
                }
            }, suppress);

            result.append(container.removeAsFragment());
        }

        while (containers.length > arrayDefined.length) {
            // don't dispose yet, might need these alive later
            containers.pop()!.removeAsFragment();
        }
    }, suppress);

    result.registerCleanup({ dispose() { containers.forEach(cleanupSpan); } })
    result.registerCleanup(lengthSubscription);

    return result.removeAsFragment();

    function cleanupSpan(container: ElementSpan) {
        container.removeAsFragment();
        container.cleanup();
    }
}

