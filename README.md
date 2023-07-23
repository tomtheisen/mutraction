# μ-traction

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

If you have to.  There's a react integration called `mutraction-react` on npm.  It works like this.

```tsx
let [model, tracker] = track({count: 0});

function increase() { ++model.count; }

const CountDisplay = trackComponent(tracker, 
    () => <p>Click count: {model.count}</p>);

const ClickButton = trackComponent(tracker, 
    () => <button onClick={increase}>+1</button>);

const App = trackComponent(tracker, function App() {
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
