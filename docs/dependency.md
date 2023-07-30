# Dependency

Objects of this type are used to accumulate all the property get operations that occur during a span of time.  They are returned from `startDependencyTrack()` on [`Tracker`](./tracker.md) instances.

## Methods

### `endDependencyTrack()`

Stop listening for property gets.

### `getLatestChangeGeneration()`

This function is used to see whether any of the dependencies might have changed.  It returns the maximum generation from any of the dependent objects.  It has per-object granularity, not per-property.
