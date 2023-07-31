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

The proxy has a reference to the tracker.  The proxy intercepts all get, set, and delete operations.  

### Implementation notes on the tracking proxy

A few general rules are observed by the tracking proxy.  Normally, you don't need to think about it, but this is how the tracker maintains visibility of the model change history.

* If a `get` would result in an untracked object, that object is wrapped in a proxy.  The proxy is assigned to the property before resolving the `get`.
* If there are any active [Dependency](./dependency.md) objects, any time there is a `get`, the target object will be added to the dependency list.
* If a `set` is invoked directly or indirectly, it will increase the `generation` property of the [Tracker](./tracker.md).
* If a `get` would result in a method, and the `autoTransactionalize` [option](./options.md) is enabled, the method is wrapped in a function that starts a transaction, and then commits it or rolls it back, depending on whether the method throws.