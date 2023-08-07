# `<BoundInput />`

This is a 2-way model-bound `<input />`.  It can have all the same props as `<input />` with the exception of `value` and `onInput`.  This must be rendered inside of a mutraction-synchronized component tree.  It's implemented using react context.

```jsx
<BoundInput placeholder="First Name" bindValue={ () => model.firstName } />
```

## Props

* `bindValue` is a required prop that specifies the string property to be bound.  It will propagate updates in both directions.  This is passed to `getPropRef` on the [`Tracker`](./tracker.md) in ths current context.

# `<BoundTextarea />`

This works pretty much the same as `<BoundInput />`, except it's a `<textarea></textarea>`.

# `<BoundCheckbox />`

There's a slight difference to the signature here.

```jsx
<BoundCheckbox bindChecked={ () => model.isActive } />
```

## Props

* `bindChecked` is a required prop that specifies the boolean property to be bound.  It will propagate updates in both directions.  This is passed to `getPropRef` on the [`Tracker`](./tracker.md) in ths current context.

