# `effect()`

This runs a callback whenever one of its dependencies changes.  The dependencies are any tracked properties accessed during the callback.  Dependencies will be updated for every invocation to ensure that conditionals or short-circuits don't hide dependencies.

```
const [model, tracker] = track({x:1, y:2, z:3});

const fx = effect(tracker, 
    () => console.log(model.x, model.y)); // output: 1 2

model.x = 4; // output: 4 2
model.y = 5; // output: 4 5
model.z = 6; // no output

fx.dispose();
model.x = 7; // no output
```

## Arguments

* `tracker` is the [`Tracker`](./tracker.md) that's tracking the model.
* `callback` is a function to run every time one of its dependencies change.  It will be invoked once immediately.  Then each time one of its dependencies is assigned to, it will run again, and recalculate dependencies.

    `callback` can optionally return a cleanup function.  The cleanup function will be invoked immediately prior to the next invocation of `callback`.

## Return value

`effect()` returns an object with a `dispose()` method.  Call it to stop the effect and free its resources.
