# μ-traction

![mutraction logo](logo.png)

## Transactional reactive state management

```js
const [model, tracker] = track({ flavor: "yellow" });

let dogs = model.dogs = [];

// transactions nest
tracker.startTransaction();
dogs.push("rover");
dogs.push("rex");

tracker.rollback();
// model.dogs is empty now

model.rating = 9.9;
tracker.undo();
// rating is gone

tracker.redo();
// rating is back
```

There's more, but you get the idea.  `npm install mutraction` and just go wild.

## How does it work?

The model object is wrapped in a Proxy when tracking starts.  Any object read from a property of a tracked object becomes tracked.  Any mutations made to any of them is recorded in a central tracker.  The tracker also keeps a stack of active transactions.

## Why?

I wanted to make an undo/time-travel feature without immutability.  I like immutability.  Just not all the time.

## But can I use it in React?

If you have to.  There's a react integration called `mutraction-react` on npm.  It works like this.  You can also [try it in a sandbox](https://codesandbox.io/s/mutraction-react-demo-9yfylw?file=/src/index.js).

```tsx
// state lives outside the component
const [model, sync] = trackAndSync({count: 0});

function increase() { 
    ++model.count; // look at this, literally ++
}

const CountDisplay = sync(
    () => <p>Click count: { model.count }</p>);

const ClickButton = sync(
    () => <button onClick={ increase }>+1</button>);

const App = sync(function App() {
    return <>
        <ClickButton />
        <CountDisplay />
    </>;
});

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
```

## Does it really work like that?

Yes.  It uses `useSyncExternalStore`.  The tracking proxy also tracks reads.  All the property reads during component rendering are dependencies of that component instance.  When any of those properties is written to later, the tracker informs react that the external store has changed.

## Isn't that pretty heavy on memory?

Not really.  `mutraction` does not take a snapshot of the model for each mutation.  It just stores the minimal amount of data to represent the diff at each state transition.  

To provide some more concrete numbers, I added a button to the [Todo example app](./example/react-todo/) to add 10,000 distinct list items, and then remove each one of them.  That's 20,000 history items, each individually addressable. Before pressing the button, the javascript heap size was 3.35MB.  After pressing the button, with an undo queue of 20,000, the heap size was 14.71MB.

Still too much memory? You can [turn off history tracking](./docs/tracker.md).  This removes the ability to undo and start transactions, but retains the ability track dependencies.  With this change, the heap size shows no increase at all, as you might expect.  `mutraction-react` can still follow dependencies with the history turned off, and re-render components as necessary.

## Seems thin on details?

You like details?  Check out the [docs](./docs/) or [examples](./example/).