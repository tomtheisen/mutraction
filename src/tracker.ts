import { LastChangeGeneration, RecordDependency, RecordMutation } from "./symbols";
import { Dependency } from "./dependency";
import type { Mutation, SingleMutation, Transaction } from "./types";

type Subscription = (mutation: SingleMutation) => void;
export class Tracker {
    #subscribers: Set<Subscription> = new Set;
    constructor(callback?: Subscription) {
        if (callback) this.subscribe(callback);
    }

    subscribe(callback: Subscription) {
        this.#subscribers.add(callback);
        const dispose = () => this.#subscribers.delete(callback);
        return { dispose };
    }

    #notifySubscribers(mutation: SingleMutation) {
        for (const s of this.#subscribers) s(mutation);
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
        this.advanceGeneration();
        this.undoOperation(mutation);
        this.#redos.unshift(mutation);
    }
    private undoOperation(mutation: Mutation) {
        if ("target" in mutation) {
            (mutation.target as any)[LastChangeGeneration] = this.generation;
        }
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
        this.advanceGeneration();
        this.redoOperation(mutation);
        this.#transaction.operations.push(mutation);
    }
    private redoOperation(mutation: Mutation) {
        if ("target" in mutation) {
            (mutation.target as any)[LastChangeGeneration] = this.generation;
        }
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
        this.setLastChangeGeneration(mutation.target);
        this.#notifySubscribers(mutation);
    }

    getLastChangeGeneration(target: object) {
        return (target as any)[LastChangeGeneration] ?? 0;
    }

    setLastChangeGeneration(target: object) {
        if (!Object.hasOwn(target, LastChangeGeneration)) {
            Object.defineProperty(target, LastChangeGeneration, {
                enumerable: false,
                writable: true,
                configurable: false,
            });
        }
        (target as any)[LastChangeGeneration] = this.generation;
    }

    #dependencyTrackers: Set<Dependency> = new Set;

    startDependencyTrack(): Dependency {
        let deps = new Dependency(this);
        this.#dependencyTrackers.add(deps);
        return deps;
    }

    endDependencyTrack(dep: Dependency): Dependency {
        const wasTracking = this.#dependencyTrackers.delete(dep);;
        if (!wasTracking) throw Error('Dependency tracker was not active on this tracker');
        return dep;
    }

    [RecordDependency](target: object) {
        for(let dt of this.#dependencyTrackers) dt.addDependency(target);
    }
}
