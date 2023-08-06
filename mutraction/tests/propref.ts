import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { track, isTracked } from '../index.js';

test('shallow prop ref', () => {
    const [model, tracker] = track({ foo: { bar: 1 } });
    
    const pr = tracker.getPropRef(() => model.foo);

    assert.is(pr.object, model, "propref object is just the model");
    assert.equal(pr.prop, "foo", "propref prop name is foo");

    let val = pr.value;
    assert.is(val, model.foo, "value of propref is model.foo");

    val.value = "qwer";
    assert.equal(model.foo, "qwer", "assigned value to propref reflected in model");
});

test.run();
