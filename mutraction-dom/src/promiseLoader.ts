import { ElementSpan } from "./elementSpan.js"

function defaultError(reason: any) {
    return document.createTextNode(String(reason));
}

type ErrorResult = Node | ((reason: any) => Node);

/**
 * Generates a DOM node that's replaced with loading data whenever it's ready.
 * @param promise is a promise resolving to a node with the loading data.
 * @param spinner optional - is loading indicator to display until the loading is done.
 * @returns a DOM node which contains the spinner, and then the loaded data.
 */
export function PromiseLoader(
    promise: Promise<Node>, 
    spinner: Node = document.createTextNode(""),
    onError: ErrorResult = defaultError) 
{
    const span = new ElementSpan(spinner);
    promise.then(result => span.replaceWith(result));
    promise.catch(reason => span.replaceWith(typeof onError === "function" ? onError(reason) : onError));
    return span.removeAsFragment();
}
