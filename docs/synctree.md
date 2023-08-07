# `<SyncTree />`

This is a JSX component that allows an application to re-render whenever a tracked property changes.  You would generally use it like this.  It's not required to be at the top level.  Arbitrary sub-trees can by synced.  Warranty is void if they intersect though.

At this time, only function components are supported.  If there's a class component anywhere in the tree, results may be unpredictable.

```jsx
const [model, tracker] = track(modelFactory());
const root = createRoot(document.getElementById('root'));
function App() { /* ... */ }
root.render(<SyncTree tracker={ tracker } component={ App } />);
```

## Props

* `tracker` is the [`Tracker`](./tracker.md) instance that orchestrates the model changes and history... well, tracking.
* `component` is a react component function.  
