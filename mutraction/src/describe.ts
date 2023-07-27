import { Mutation } from "./types.js";

function isObject(arg: unknown): arg is Object {
    return typeof arg === "object";
}

function describeValue(val: unknown): string {
    if (val === undefined) return "undefined";
    if (val === null) return "null";
    if (Array.isArray(val)) {
        if (val.length > 3) {
            return "[" + val.slice(0, 3).map(describeValue).join() + ", ...]";
        }
        else {
            return "[" + val.map(describeValue).join() + "]";
        }
    }
    if (typeof val === "object") return "object";
    if (typeof val === "string") return JSON.stringify(val);
    return String(val);
}

export function describeMutation(mutation: Readonly<Mutation>): string {
    switch(mutation.type) {
        case "create":
            return `Create property [${ describeValue(mutation.name) }] = ${ describeValue(mutation.newValue) }`;
        case "delete":
            return `Delete property [${ describeValue(mutation.name) }]`;
        case "change":
            return `Change property [${ describeValue(mutation.name) }] = ${ describeValue(mutation.newValue) }`;
        case "arrayshorten":
            return `Shorten array to length ${ mutation.newLength }`;
        case "arrayextend":
            return `Extend array to index ${ mutation.newIndex } with value ${ describeValue(mutation.newValue) }`;
        case "transaction":
            const operationsDescription = mutation.operations.map(describeMutation).join();
            if (mutation.transactionName) {
                return `Traction "${ mutation.transactionName }": [${ operationsDescription }]`;
            }
            else {
                return `Traction: [${ operationsDescription }]`;
            }
        default:
            mutation satisfies never;
    }
    throw Error("unsupported mutation type"); // satisfies type checker;
}