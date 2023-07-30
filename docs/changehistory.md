# `ChangeHistory`

This is a React function component.  It shows the change history for the given [`Tracker`](./tracker.md).  It's probably more useful for diagnostic and debugging purposes than for production, as it offers no ability to customize the appearance of the output.

`ChangeHistroy` uses `useSyncExternalStore` keep itself synchronized.

```jsx
const [model, syncWrap, myTracker] = trackAndSync({ });

const App = syncWrap(function App() {
    return <div>
        <ChangeHistory tracker={ myTracker } />
        {/* more code here */}
    </div>;
});
```

## Props:

* `tracker` is the [`tracker`](./tracker.md) instance to show history from.