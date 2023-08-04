# Options

The options object can be used to configure the behavior of mutraction.

## Properties

### `trackHistory`: boolean? 

Enables or disables history tracking.  If history tracking is disabled, transactions and history management will not be available, but memory usage will be lower.  The default value for `trackHistory` is `true`.

### `autoTransactionalize`: boolean?

Enable or disable the automatic creation of transactions when model methods are called.  When you call a method on a tracked object, this option will make a transaction surrounding every method call.  Transactions created this way will be automatically committed.  If the method throws, they'll be rolled back instead.  The default value for `autoTransactionalize` is `false`;

`autoTransactionalize` requires `trackHistory`.

### `deferNotifications`: boolean?

This controls when [`tracker`](./tracker.md) subscribers are notified.  Tracker subscriptions are started using the `subscribe()` method.  If `deferNotifications` is false, subscribers will be notified immediately.

```js
// deferNotifications: false

model.prop1 = val1;
// subscribers are notified of prop1 change
model.prop2 = val2;
// subscribers are notified of prop2 change
```

If `deferNotifications` is true, subscribers will notified in a microtask which will execute after the current call stack is done running.  This is accomplished via `queueMicrotask()`.

```js
// deferNotifications: true

model.prop1 = val1;
model.prop2 = val2;

// subscribers are notified for both changes later
```

The default value for `deferNotifications` is `true`.