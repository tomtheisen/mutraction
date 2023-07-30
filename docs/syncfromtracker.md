# `syncFromTracker`

This is an alternative to [`trackAndSync`](./trackandsync.md) that offers a bit more control.  In fact, it calls this.

## Arguments

* `tracker` is a [Tracker](./tracker.md) to be used for following read dependencies.
* `Component` is a react component function.  I guess that makes this a higher order component.

## Return value

The return value is areact component function that automatically gets rendered whenever any of the tracked properties are read.  It uses `useSyncExternalStore`.
