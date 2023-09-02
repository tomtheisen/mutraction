import { effect } from "./effect.js"
import { ElementSpan } from './elementSpan.js';
import { getMarker } from './getMarker.js';
import { isNodeOptions, type NodeOptions } from "./types.js";

const suppress = { suppressUntrackedWarning: true };

/**
 * Generates DOM nodes for an array of values.  The resulting nodes track the array indices.
 * Re-ordering the array will cause affected nodes to be re-generated.
 * @see ForEachPersist if you want DOM nodes to follow the array elements through order changes
 * @param array is the input array
 * @param map is the callback function to produce DOM nodes
 * @returns a DOM node you can include in a document
 */
export function ForEach<TIn>(array: TIn[], map: (item: TIn, index: number, array: TIn[]) => Node | NodeOptions): Node {
    const result = new ElementSpan();
    type Output = { container: ElementSpan, cleanup?: () => void };
    const outputs: Output[] = [];

    effect(lengthDep => {
        // i is scoped to each loop body invocation
        for (let i = outputs.length; i < array.length; i++) {
            const output: Output = { container: new ElementSpan() };
            outputs.push(output);

            effect(itemDep => {
                output.cleanup?.();
                const item = array[i];

                // in operations like .splice() elements are removed prior to updating length
                // so this code needs to be null-tolerant even though the type system says otherwise.
                const projection = item !== undefined ? map(item, i, array) : getMarker("ForEach undefined placeholder");

                if (isNodeOptions(projection)) {
                    output.container.replaceWith(projection.node);
                    output.cleanup = projection.cleanup;
                }
                else {
                    output.container.replaceWith(projection);
                    output.cleanup = undefined;
                }
            }, suppress);

            result.append(output.container.removeAsFragment());
        }

        while (outputs.length > array.length) {
            const { cleanup, container } = outputs.pop()!;
            cleanup?.();
            container.removeAsFragment();
        }
    }, suppress);

    return result.removeAsFragment();
}

/**
 * Generates DOM nes for an array of objects.  The resulting nodes track the array elements.
 * Re-ordering the array will cause the generated nodes to re-ordered in parallel
 * @param array is the input array of objects.  Primitive values can't be used.
 * @param map is the callback function to produce DOM nodes
 * @returns a DOM node you can include in a document
 */
export function ForEachPersist<TIn extends object>(array: TIn[], map: (e: TIn) => Node): Node {
    const result = new ElementSpan();
    const containers: ElementSpan[] = [];
    const outputMap = new WeakMap<TIn, HTMLElement | ElementSpan>;

    effect(() => {
        // i is scoped to each loop body invocation
        for (let i = containers.length; i < array.length; i++) {
            const container = new ElementSpan();
            containers.push(container);

            effect((dep) => {
                // this is wild - just keep the contents together with a parent somewhere
                container.emptyAsFragment();

                const item = array[i];
                if (item == null) return; // probably an array key deletion

                if (typeof item !== "object") throw Error("Elements must be object in ForEachPersist");
                
                let newContents = outputMap.get(item);
                if (newContents == null) {
                    if (dep) dep.active = false;
                    let newNode = map(item);
                    newContents = newNode instanceof HTMLElement ? newNode : new ElementSpan(newNode);
                    outputMap.set(item, newContents);
                    if (dep) dep.active = true;
                }

                if (newContents instanceof HTMLElement) {
                    container.replaceWith(newContents);
                }
                else {
                    container.replaceWith(newContents.removeAsFragment());
                }
            }, suppress);

            result.append(container.removeAsFragment());
        }

        while (containers.length > array.length) {
            containers.pop()!.removeAsFragment();
        }
    }, suppress);

    return result.removeAsFragment();
}

