# Dependency List

Objects of this type are used to accumulate all the property get operations that occur during a span of time.  They are returned from `startDependencyTrack()` on [`Tracker`](./tracker.md) instances.

Active dependency lists form a stack.  Each property get operation notifies only the top active dependency list in the stack.

## Methods

### `endDependencyTrack()`

Stop listening for property gets.

### `getLatestChangeGeneration()`

This function is used to see whether any of the dependencies might have changed.  It returns the maximum generation from any of the dependent objects.  It has per-object granularity, not per-property.

"Generation" is a way of tracking the order of data changes.  Every time a property is changed on a tracked object, the `generation` property of the [`Tracker`](./tracker.md) is incremented.  The generation of the mutated object is then updated with the new tracker generation.

All this is to say, when the result of this method changes, then that means one of its tracked dependencies has been changed.