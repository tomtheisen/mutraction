# Documentation

## mutraction

This is the basic state tracking package.  You can use it on its own.  It's `mutraction` on npm.

### `track`

This function is the main entry point for mutraction.  Call this with the object you want to track.

```
const [trackedModel, tracker] =  track(model, callback);
```

#### Arguments

* `model` is the object you want to track.
* `callback` is an optional function reference called when a mutation happens.

#### Return value

`track` returns an array containing two elements.

* the model object wrapped in a tracking proxy
* a [Tracker](#tracker) object that can be used to observe and manage state changes

### `isTracked`

This tests whether an object has a tracking proxy attached.

#### Arguments

* `obj` is the object you want to test.

#### Return value

`istracked` returns a boolean value indicating whether the object is tracked or not.

### `getTracker`

`getTracker` is a function returns the [Tracker](#tracker) for an object, if any.

#### Arguments

* `obj` is the object whose tracker you want to get.

#### Return value

This returns the [Tracker](#tracker) for the object, if any.  If none are present, `undefined` will be returned instead.

### <a name=tracker></a>`Tracker`

`Tracker` objects are used to observe and manage state changes for an object graph.  [Full documentation](tracker.md)


## mutraction-react

This package provides a react integration to make components automatically react to model mutations.  It's `mutraction-react` on npm.

### `trackAndSync`

This takes the initial state of the model and returns a tracked model, and a component wrapper for tracking its changes.

```ts
const [model, syncWrap, tracker] = 
    trackAndSync({ title: "Quarterly Earnings" });

const Title = syncWrap(() => <h1>{ model.title }</h1>);

model.title += " *";
```

#### Arguments

* `model` is an untracked data model that will be tracked.

#### Return value

This function returns a three-element array.

* `trackedModel` is the proxy-tracked data model.
* `syncWrap` is the component wrapper that enables mutation-triggered updates.
* `tracker` is a [Tracker](#tracker) object that provides more control over the mutation history. 

### `syncFromTracker`

This is an alternative to `trackAndSync` that offers a bit more control.  In fact, it calls this.

#### Arguments

* `tracker` is a [Tracker](#tracker) to be used for following read dependencies.
* `Component` is a react component function.  I guess this is a higher order component.

#### Return value

The return value is areact component function that automatically gets rendered whenever any of the tracked properties are read.  It uses `useSyncExternalStore`.

### `key`

This gets a stable unique number for each distinct object.  It uses a `WeakMap`.  This can provide a value for react element `key` properties.  Due to react limitations, only `string`s and `number`s can be `key` values.  There's no need to explicitly dispose entries here.  Let garbage collection do the work, I always say.

#### Arguments

* `obj` is the object to be identified.

#### Return value

This returns a unique number for each object.  The same output will always be returned for each input.
