# Tracker

`Tracker` objects are used to observe and manage state changes for an object graph.

## Constructor

```
new Tracker(options?)
```

The `Tracker` constructor takes an optional `options` object.  `options` has a single property boolean property `trackHistory` that enables or disables history tracking.  If history tracking is disabled, transactions and history management will not be available, but memory usage will be lower.

## Properties

### `history`

This is a read-only property that contains an array of all the mutations that occurred.  When an undo happens, this array will shrink.  When a redo happens, it grows.  Each mutation is represented by an object.

### `generation`

This is a read-only property that changes whenever mutations happen.  It's always a non-negative number.  It never decreases over time.  Whenever a mutation happens anywhere in the tracked object graph, this number will increase.  An undo will also cause this number to increase.

## Methods

### `startTransaction()`
### `commit()`
### `rollback()`

These methods control batches of changes.  Starting a new transaction establishes a checkpoint.  If you're happy with the changes made during a transaction, you can commit it to keep them.  If you'd like to revert the changes instead, you can roll it back.

Transactions are recursive.  Each time you commit or rollback, it applies to the inner-most transaction.

None of these methods have a return value.

### `undo()`
### `redo()`
### `clearRedos()`

You can undo the last mutation.  If the last change was a committed transaction, it will be undone entirely.  You can undo repeatedly until the object reaches its original state.

After undoing, you can redo to restore the changes.  You can continue to redo until all the undo operations have been reverted.

Making any mutation to the object graph will instantly invalidate the redo stack, making it impossible to redo.  You can also call `clearRedos()` to achieve the same effect.

### `clearHistory()`

This commits all active transactions and then clears the undo and redo queues. 

### `startDependencyTrack()`

This returns a `Dependency` that will monitor all the property gets in the object graph.

# Dependency

Objects of this type are used to accumulate all the property get operations that occur during a span of time.

## Methods

### `endDependencyTrack()`

Stop listening for property gets.

### `getLatestChangeGeneration()`

This function is used to see whether any of the dependencies might have changed.  It returns the maximum generation from any of the dependent objects.  It has per-object granularity, not per-property.
