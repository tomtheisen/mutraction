type BaseSingleMutation = { target: object, path: ReadonlyArray<string | symbol>, name: string | symbol };
type CreateProperty = BaseSingleMutation & { type: "create", newValue: any };
type DeleteProperty = BaseSingleMutation & { type: "delete", oldValue: any };
type ChangeProperty = BaseSingleMutation & { type: "change", oldValue: any, newValue: any };
type SingleMutation = CreateProperty | DeleteProperty | ChangeProperty
type Transaction = {type: "transaction", parent?: Transaction, operations: Mutation[]};
type Mutation = SingleMutation | Transaction;

const RecordMutation = Symbol('RecordMutation');

class Tracker {
    #transaction: Transaction = { type: "transaction", operations: [] };
    #redos: Mutation[] = [];

    get history(): ReadonlyArray<Readonly<Mutation>> { return this.#transaction.operations; }

    // add another transaction to the stack
    startTransaction() {
        this.#transaction = { type: "transaction", parent: this.#transaction, operations: [] };
    }
    // resolve and close the most recent transaction
    // throws if no transactions are active
    commit() {
        if (!this.#transaction?.parent) throw 'Cannot commit root transaction';
        this.#transaction.parent.operations.push(this.#transaction);
        this.#transaction = this.#transaction.parent;
    }
    // undo all operations done since the beginning of the most recent trasaction
    // remove it from the transaction stack
    // if no transactions are active, undo all mutations
    rollback() {
        while (this.#transaction.operations.length) this.undo();
        this.#transaction = this.#transaction.parent ?? this.#transaction;
    }
    // undo last mutation or transaction and push into the redo stack
    undo() {
        const mutation = this.#transaction.operations.pop();
        if (!mutation) return;
        this.undoOperation(mutation);
        this.#redos.unshift(mutation);
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
        }
    }
    // repeat last undone mutation
    redo() {
        const mutation = this.#redos.shift();
        if (!mutation) return;
        this.redoOperation(mutation);
        this.#transaction.operations.push(mutation);
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
        }
    }
    // clear the redo stack  
    // any direct mutation implicitly does this
    clearRedos() {
        this.#redos.length = 0;
    }
    // record a mutation, if you have the secret key
    [RecordMutation](mutation: Mutation) {
        this.#transaction.operations.push(Object.freeze(mutation));
        this.clearRedos();
    }
}

const proxied = new WeakSet;

function makeProxyHandler<TModel extends object>(
    model: TModel, 
    tracker: Tracker,
    path: ReadonlyArray<string | symbol> = []
) : ProxyHandler<TModel> {
    return {
        set(target, name: (keyof TModel) & (string | symbol), newValue) {
            if (typeof newValue === 'object') {
                if (proxied.has(newValue)) throw 'Object already being tracked. The same object may not be tracked from multiple locations.';
                proxied.add(newValue);
                newValue = structuredClone(newValue);
                const handler = makeProxyHandler(newValue, tracker, path.concat(name));
                newValue = new Proxy(newValue, handler);
            }
            const mutation: SingleMutation = name in target
                ? { type: "change", target, path, name, oldValue: model[name], newValue }
                : { type: "create", target, path, name, newValue };
            tracker[RecordMutation](mutation);
            target[name] = newValue;
            return true;
        },
        deleteProperty(target, name: (keyof TModel) & (string | symbol)) {
            const mutation: SingleMutation = { type: "delete", target, path, name, oldValue: model[name] };
            tracker[RecordMutation](mutation);
            delete target[name];
            return true;
        }
    }
}

// turn on change tracking
// returns a proxied model object, and tracker to control history
export function track<TModel extends object>(model: TModel): [TModel, Tracker] {
    const tracker = new Tracker;
    const proxied = new Proxy(model, makeProxyHandler(model, tracker));
    return [proxied, tracker];
}
