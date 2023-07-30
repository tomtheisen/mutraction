# `track`

This function is the main entry point for mutraction.  Call this with the object you want to track.

```
const [trackedModel, tracker] =  track(model, options);
```

## Arguments

* `model` is the object you want to track.
* `options` is an optional [configuration object](./options.md).

## Return value

`track` returns an array containing two elements.

* the model object wrapped in a tracking proxy
* a [Tracker](./tracker.md) object that can be used to observe and manage state changes

