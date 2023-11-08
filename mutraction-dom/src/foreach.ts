import { effect } from "./effect.js"
import { ElementSpan } from './elementSpan.js';
import { Swapper } from "./swapper.js";
import { isNodeOptions, type NodeOptions } from "./types.js";

const suppress = { suppressUntrackedWarning: true };

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
    type Output = { container: ElementSpan, cleanup?: () => void };
    const outputs: Output[] = [];

    const arrayDefined = array ?? [];
    effect(function forEachLengthEffect(lengthDep) {
        // i is scoped to each loop body invocation
        for (let i = outputs.length; i < arrayDefined.length; i++) {
            const output: Output = { container: new ElementSpan() };
            outputs.push(output);

            effect(function forEachItemEffect(dep) {
                output.cleanup?.();
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
            }, suppress);

            result.append(output.container.removeAsFragment());
        }

        while (outputs.length > arrayDefined.length) {
            const { cleanup, container } = outputs.pop()!;
            cleanup?.();
            container.cleanup();
            container.removeAsFragment();
        }
    }, suppress);

    return result.removeAsFragment();
}

/**
 * Generates DOM nes for an array of objects.  The resulting nodes track the array elements.
 * Re-ordering the array will cause the generated nodes to re-ordered in parallel
 * @param array is the input array of objects.  Primitive element values can't be used. If it's a function returning an array, identity changes to the array itself will be tracked.
 * @param map is the callback function to produce DOM nodes
 * @returns a DOM node you can include in a document
 */
export function ForEachPersist<TIn extends object>(array: TIn[] | (() => TIn[]) | undefined, map: (e: TIn) => Node): Node {
    if (typeof array === "function") return Swapper(() => ForEachPersist(array(), map));

    const result = new ElementSpan();
    const containers: ElementSpan[] = [];
    const outputMap = new WeakMap<TIn, HTMLElement | ElementSpan>;

    const arrayDefined = array ?? [];
    effect(function forEachPersistLengthEffect(lengthDep) {
        // i is scoped to each loop body invocation
        for (let i = containers.length; i < arrayDefined.length; i++) {
            const container = new ElementSpan();
            containers.push(container);

            effect(function forEachPersistItemEffect(dep) {
                // just keep the contents together with a parent somewhere
                container.emptyAsFragment();

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
            const container = containers.pop()!;
            container.removeAsFragment();
            container.cleanup();
        }
    }, suppress);

    return result.removeAsFragment();
}

