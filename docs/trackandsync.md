# `trackAndSync()`

This takes the initial state of the model and returns a tracked model, and a component wrapper for tracking its changes.

```ts
const [model, syncWrap, tracker] = 
    trackAndSync({ title: "Quarterly Earnings" });

const Title = syncWrap(() => <h1>{ model.title }</h1>);

model.title += " *";
```

## Arguments

* `model` is an untracked data model that will be tracked.
* `options` is an optional [configuration object](./options.md).

## Return value

This function returns a three-element array.

* `trackedModel` is the proxy-tracked data model.
* `syncWrap` is the component wrapper that enables mutation-triggered updates.
* `tracker` is a [Tracker](./tracker.md) object that provides more control over the mutation history. 
