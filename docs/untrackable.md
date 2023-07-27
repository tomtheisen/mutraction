# Limitations

Not every value can by tracked by mutraction.  Here are some kinds that can't.

## Non-objects

The root value being tracked must be an object.  Arrays are objects too.  But strings and numbers aren't.

```js
const [model, tracker] = track({ num: 5 }); // this is fine

const [model2, tracker2] = track(5);
// TypeError: Cannot create proxy with a non-object as target or handler
```

## Objects with private properties

Private properties can't be manipulated and observed by the tracking proxies mutraction uses.  This means and `get` or `set` on one of these properties in a tracked object will throw.

```js
class Customer {
    #firstName = "";
    #lastName = "";

    constructor(first, last) {
        this.firstName = first;
        this.lastName = last;
    }

    get fullName() {
        return this.#firstName + " " + this.#lastName;
    }
}

const [model, tracker] = track(new Customer("Elvis", "Presley"));

// Cannot read private member #firstName from an object whose class did not declare it
console.log(model.fullName);
```

## `arguments` objects

These are the array-like objects that contain function arguments.  They have special behavior.  Accomodating it hasn't been implemented.

```js
function fn() {
    const [model, tracker] = track(arguments);
    // Your results may vary.
}
fn("foo", "bar");
```

## Integer-indexed collections

This includes typed arrays, `DataView`, and `ArrayBuffer` objects.  These objects have special behavior.  Accomodating it hasn't been implemented.

```js
const [model, tracker] = track(new Uint8Array(16));
// Your results may vary.
```

