# Tracker

`Tracker` objects are used to observe and manage state changes for an object graph.  Generally, you'll probably want to get these from the [`track`](./track.md) function rather than constructing one directly.

## Constructor

```
new Tracker(options?)
```

The `Tracker` constructor takes an optional [`options` object](./options.md).  

## Properties

### `history`

This is a read-only property that contains an array of all the mutations that occurred.  When an undo happens, this array will shrink.  When a redo happens, it grows.  Each mutation is represented by an object.

### `generation`

This is a read-only property that changes whenever mutations happen.  It's always a non-negative number.  It never decreases over time.  Whenever a mutation happens anywhere in the tracked object graph, this number will increase.  An undo will also cause this number to increase.

## Methods

### `startTransaction(name?)`

Starting a new transaction establishes a checkpoint.  If you're happy with the changes made during a transaction, you can commit it to keep them.  If you'd like to revert the changes instead, you can roll it back.  Transactions are recursive.  Each time you commit or rollback, it applies to the inner-most transaction.

#### Arguments

* `name` is the optional name of the transaction.  Transaction names have no functional impact, but can be useful for inspecting the change history.

#### Return value

The transaction object is returned.  It has an optional `transactionName`, optional `parentTransaction`, and a `operations` array.

### `commit(transaction?)`
### `rollback(transaction?)`

These methods resolve the current transaction.  Commit to keep the changes.  Roll back to discard.  Transactions are recursive.  Each time you commit or rollback, it applies to the inner-most transaction.

Neither of these methods have a return value.

#### Arguments

* `transaction` is the transaction object to resolve.  It must be newest un-resolved transaction.  If you omit this parameter, it will be determined automatically.  Supplying this parameter acts as an assertion that the transaction stack has not gotten unbalanced.

### `subscribe(callback)`

This method registers a callback to be notified any time the tracked model changes.  The callback will be invoked for any property change.  It will not be invoked for starting or commiting a transaction.  Rollback, undo, and redo will trigger a callback if they cause a property to change.

#### Arguments

* `callback` is a function that takes a "mutation" object, and has no return value.  The object structure is given the exported type `SingleMutation` in this typescript excerpt.  Each mutation object contains enough information to undo and redo the change of state.

    ```ts
    type Key = string | symbol;
    type BaseSingleMutation = { target: object, name: Key };
    type CreateProperty = BaseSingleMutation & { type: "create", newValue: any };
    type DeleteProperty = BaseSingleMutation & { type: "delete", oldValue: any };
    type ChangeProperty = BaseSingleMutation & { type: "change", oldValue: any, newValue: any };

    // adds a single element OOB to an array
    type ArrayExtend = BaseSingleMutation & { type: "arrayextend", oldLength: number, newIndex: number, newValue: any };

    // shorten an array using the length setter
    type ArrayShorten = BaseSingleMutation & { type: "arrayshorten", oldLength: number, newLength: number, removed: ReadonlyArray<any> };

    type SingleMutation = CreateProperty | DeleteProperty | ChangeProperty | ArrayExtend | ArrayShorten;
    ```

#### Return value

An object is returned containing a `dispose()` method.  Call it to terminate the subscription.

### `undo()`
### `redo()`
### `clearRedos()`

You can undo the last mutation.  If the last change was a committed transaction, it will be undone entirely.  You can undo repeatedly until the object reaches its original state.

After undoing, you can redo to restore the changes.  You can continue to redo until all the undo operations have been reverted.

Making any mutation to the object graph will instantly invalidate the redo stack, making it impossible to redo.  You can also call `clearRedos()` to achieve the same effect.

### `clearHistory()`

This commits all active transactions and then clears the undo and redo queues. 

### `startDependencyTrack()`

This returns a [`Dependency`](./dependency.md) that will monitor all the property gets in the object graph.
