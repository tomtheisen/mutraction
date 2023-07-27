import { LastChangeGeneration, RecordDependency, RecordMutation } from "./symbols.js";
import { Dependency } from "./dependency.js";
import type { Mutation, SingleMutation, Transaction } from "./types.js";

// When found in a dependency list, the presence of this object indicates
// that the tracker history itself is a dependency.  Any change to the
// model, including undo and redo constitutes a change in the dependency.
const HistorySentinel = {};

type Subscriber = (mutation: SingleMutation) => void;

export type TrackerOptions = {
    trackHistory?: boolean;
}

export class Tracker {
    #subscribers: Set<Subscriber> = new Set;
    #transaction?: Transaction;
    #redos: Mutation[] = [];
    #generation = 0;

    constructor(options?: TrackerOptions) {
        if (options?.trackHistory ?? true) {
            // create root transaction to enable history tracking
            this.#transaction = { type: "transaction", operations: [] };
        }
    }

    subscribe(callback: Subscriber) {
        this.#subscribers.add(callback);
        const dispose = () => this.#subscribers.delete(callback);
        return { dispose };
    }

    #notifySubscribers(mutation: SingleMutation) {
        for (const sub of this.#subscribers) sub(mutation);
    }

    ensureHistory(): Transaction {
        if (!this.#transaction) throw new Error("History tracking disabled.");
        return this.#transaction;
    }

    tracksHistory() {
        return !!this.#transaction;
    }

    get history(): ReadonlyArray<Readonly<Mutation>> {
        const transaction = this.ensureHistory();
        this[RecordDependency](HistorySentinel);
        return transaction.operations; 
    }
    get generation() { return this.#generation; }

    private advanceGeneration() {
        ++this.#generation;
    }

    // add another transaction to the stack
    startTransaction(name?: string) {
        const transaction = this.ensureHistory();
        this.#transaction = { type: "transaction", parent: transaction, operations: [] };
        if (name) this.#transaction.transactionName = name;
    }

    // resolve and close the most recent transaction
    // throws if no transactions are active
    commit() {
        const transaction = this.ensureHistory();
        if (!transaction.parent) throw 'Cannot commit root transaction';
        const parent = transaction.parent;
        parent.operations.push(transaction);
        transaction.parent = undefined;
        this.#transaction = parent;
    }

    // undo all operations done since the beginning of the most recent trasaction
    // remove it from the transaction stack
    // if no transactions are active, undo all mutations
    rollback() {
        const transaction = this.ensureHistory();
        while (transaction.operations.length) this.undo();
        this.#transaction = transaction.parent ?? transaction;
        this.advanceGeneration();
    }

    // undo last mutation or transaction and push into the redo stack
    undo() {
        const transaction = this.ensureHistory();
        const mutation = transaction.operations.pop();
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
                return;
            case 'arrayextend':
                (mutation.target as any).length = mutation.oldLength;
                break;
            case 'arrayshorten':
                (mutation.target as any).push(...mutation.removed);
                break;
            default:
                mutation satisfies never;
        }
        this.#notifySubscribers(mutation);
    }

    // repeat last undone mutation
    redo() {
        const transaction = this.ensureHistory();
        const mutation = this.#redos.shift();
        if (!mutation) return;
        this.advanceGeneration();
        this.redoOperation(mutation);
        transaction.operations.push(mutation);
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
                return;
            case 'arrayextend':
                (mutation.target as any)[mutation.newIndex] = mutation.newValue;
                break;
            case 'arrayshorten':
                (mutation.target as any).length = mutation.newLength;
                break;
            default:
                mutation satisfies never;
        }
        this.#notifySubscribers(mutation);
    }

    // clear the redo stack  
    // any direct mutation implicitly does this
    clearRedos() {
        this.#redos.length = 0;
    }
    
    clearHistory() {
        const transaction = this.ensureHistory();
        transaction.parent = undefined;
        transaction.operations.length = 0;
        this.clearRedos();
    }

    // record a mutation, if you have the secret key
    [RecordMutation](mutation: SingleMutation) {
        if (this.#transaction) {
            // history tracking is enabled
            this.#transaction.operations.push(Object.freeze(mutation));
        }
        this.clearRedos();
        this.advanceGeneration();
        this.setLastChangeGeneration(mutation.target);
        this.#notifySubscribers(mutation);
    }

    getLastChangeGeneration(target: object) {
        // The history itself is a dependency.  Therefore, every change to the model
        // affects this dependency.  So return the tracker's current generation.
        if (target === HistorySentinel) return this.generation;

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
        for (const dt of this.#dependencyTrackers) {
            dt.addDependency(target);
        }
    }
}
