import { RecordMutation } from "./symbols";
import type { Mutation, SingleMutation, Transaction } from "./types";

export class Tracker {
    #callback?: (mutation: SingleMutation) => void;
    constructor(callback?: (mutation: SingleMutation) => void) {
        this.#callback = callback;
    }

    #transaction: Transaction = { type: "transaction", operations: [] };
    #redos: Mutation[] = [];
    #generation = 0;

    get history(): ReadonlyArray<Readonly<Mutation>> { return this.#transaction.operations; }
    get generation() { return this.#generation; }

    private advanceGeneration() {
        ++this.#generation;
    }

    // add another transaction to the stack
    startTransaction() {
        this.#transaction = { type: "transaction", parent: this.#transaction, operations: [] };
    }

    // resolve and close the most recent transaction
    // throws if no transactions are active
    commit() {
        if (!this.#transaction?.parent) throw 'Cannot commit root transaction';
        const parent = this.#transaction.parent;
        parent.operations.push(this.#transaction);
        this.#transaction.parent = undefined;
        this.#transaction = parent;
    }

    // undo all operations done since the beginning of the most recent trasaction
    // remove it from the transaction stack
    // if no transactions are active, undo all mutations
    rollback() {
        while (this.#transaction.operations.length) this.undo();
        this.#transaction = this.#transaction.parent ?? this.#transaction;
        this.advanceGeneration();
    }

    // undo last mutation or transaction and push into the redo stack
    undo() {
        const mutation = this.#transaction.operations.pop();
        if (!mutation) return;
        this.undoOperation(mutation);
        this.#redos.unshift(mutation);
        this.advanceGeneration();
    }
    private undoOperation(mutation: Mutation) {
        switch (mutation.type) {
            case 'change':
            case 'delete':
                (mutation.target as any)[mutation.name] = mutation.oldValue;
                break;
            case 'create':
                delete (mutation.target as any)[mutation.name];
                break;
            case 'transaction':
                for (let i = mutation.operations.length; i-- > 0;) {
                    this.undoOperation(mutation.operations[i]);
                }
                break;
            case 'arrayextend':
                (mutation.target as any).length = mutation.oldLength;
                break;
            case 'arrayshorten':
                (mutation.target as any).push(...mutation.removed);
                break;
            default:
                mutation satisfies never;
        }
    }

    // repeat last undone mutation
    redo() {
        const mutation = this.#redos.shift();
        if (!mutation) return;
        this.redoOperation(mutation);
        this.#transaction.operations.push(mutation);
        this.advanceGeneration();
    }
    private redoOperation(mutation: Mutation) {
        switch (mutation.type) {
            case 'change':
            case 'create':
                (mutation.target as any)[mutation.name] = mutation.newValue;
                break;
            case 'delete':
                delete (mutation.target as any)[mutation.name];
                break;
            case 'transaction':
                for (let i = 0; i < mutation.operations.length; i++) {
                    this.redoOperation(mutation.operations[i]);
                }
                break;
            case 'arrayextend':
                (mutation.target as any)[mutation.newIndex] = mutation.newValue;
                break;
            case 'arrayshorten':
                (mutation.target as any).length = mutation.newLength;
                break;
            default:
                mutation satisfies never;
        }
    }

    // clear the redo stack  
    // any direct mutation implicitly does this
    clearRedos() {
        this.#redos.length = 0;
    }

    // record a mutation, if you have the secret key
    [RecordMutation](mutation: SingleMutation) {
        this.#transaction.operations.push(Object.freeze(mutation));
        this.clearRedos();
        this.advanceGeneration();
        this.#callback?.(mutation);
    }
}

