# `key()`

This gets a stable unique number for each distinct object.  It uses a `WeakMap`.  This can provide a value for react element `key` properties.  Due to react limitations, only `string`s and `number`s can be `key` values.  There's no need to explicitly dispose entries here.  Let the garbage collector do the work, I always say.

## Arguments

* `obj` is the object to be identified.

## Return value

This returns a unique number for each object.  The same output will always be returned for each input.
