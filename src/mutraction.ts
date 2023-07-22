type Key = string | symbol;
type BaseSingleMutation = { target: object, path: ReadonlyArray<Key>, name: Key };
type CreateProperty = BaseSingleMutation & { type: "create", newValue: any };
type DeleteProperty = BaseSingleMutation & { type: "delete", oldValue: any };
type ChangeProperty = BaseSingleMutation & { type: "change", oldValue: any, newValue: any };

// adds a single element OOB to an array
type ArrayExtend = BaseSingleMutation & { type: "arrayextend", oldLength: number, newIndex: number, newValue: any };

type SingleMutation = CreateProperty | DeleteProperty | ChangeProperty | ArrayExtend;
type Transaction = {type: "transaction", parent?: Transaction, operations: Mutation[]};
type Mutation = SingleMutation | Transaction;

const RecordMutation = Symbol('RecordMutation');
const IsTracked = Symbol("IsTracked");
const GetTracker = Symbol("GetTracker");

class Tracker {
    #callback?: (mutation: SingleMutation) => void;
    constructor(callback?: (mutation: SingleMutation) => void) {
        this.#callback = callback;
    }

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
                break;
            case 'arrayextend':
                (mutation.target as any).length = mutation.oldLength;
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
        this.#callback?.(mutation);
    }
}

function isArrayIndex(name: string | symbol): name is string {
    if (typeof name !== "string") return false;
    if (!/^\d{1,10}$/.test(name)) return false;
    return parseInt(name, 10) < 0x7fff_ffff;
}

function makeProxyHandler<TModel extends object>(
    model: TModel,
    tracker: Tracker,
    path: ReadonlyArray<Key> = []
) : ProxyHandler<TModel> {
    type TKey = (keyof TModel) & Key;

    function get(target: TModel, name: TKey) {
        if (name === IsTracked) return true;
        if (name === GetTracker) return tracker;
        let result = target[name] as any;
        if (typeof result !== 'object' || result[IsTracked]) return result;
        const handler = makeProxyHandler(result, tracker, path.concat(name));
        return target[name] = new Proxy(result, handler);
    }

    function setOrdinary(target: TModel, name: TKey, newValue: any) {
        if (typeof newValue === 'object' && !newValue[IsTracked]) {
            const handler = makeProxyHandler(newValue, tracker, path.concat(name));
            newValue = new Proxy(newValue, handler);
        }
        const mutation: SingleMutation = name in target
            ? { type: "change", target, path, name, oldValue: model[name], newValue }
            : { type: "create", target, path, name, newValue };
        tracker[RecordMutation](mutation);
        return Reflect.set(target, name, newValue);
    }

    function setArray(target: TModel, name: TKey, newValue: any) {
        if (!Array.isArray(target)) {
            throw 'This object used to be an array.  Expected an array.';
        }
        if (name === "length") {
            //throw 'no length changes';
        }
        
        if (isArrayIndex(name)) {
            const index = parseInt(name, 10);
            if (index >= target.length) {
                // assignment to array index will lengthen array    
                const extension: ArrayExtend = { 
                    type: "arrayextend", target, name, path, 
                    oldLength: target.length,
                    newIndex: index,
                    newValue
                };
                tracker[RecordMutation](extension);
                return Reflect.set(target, name, newValue);
            }
        }

        return setOrdinary(target, name, newValue);
    }

    function deleteProperty(target: TModel, name: TKey) {
        const mutation: DeleteProperty = { type: "delete", target, path, name, oldValue: model[name] };
        tracker[RecordMutation](mutation);
        return Reflect.deleteProperty(target, name);
    }

    let set = setOrdinary;
    if (Array.isArray(model)) set = setArray;

    return { get, set, deleteProperty };
}

export function isTracked(obj: object) {
    return typeof obj === "object" && (obj as any)[IsTracked];
}

export function getTracker(obj: object) {
    return (obj as any)[GetTracker];
}

// turn on change tracking
// returns a proxied model object, and tracker to control history
export function track<TModel extends object>(model: TModel, callback?: (mutation: SingleMutation) => void): [TModel, Tracker] {
    const tracker = new Tracker(callback);
    const proxied = new Proxy(model, makeProxyHandler(model, tracker));
    return [proxied, tracker];
}
