import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { track, isTracked } from '../index.js';

test('shallow prop ref', () => {
    const [model, tracker] = track({ foo: { bar: 1 } });
    
    const pf = tracker.getPropRef(() => model.foo);

    assert.is(pf.object, model);
    assert.equal(pf.object, "foo");

    let val = pf.value;
    assert.is(val, model.foo);

    val.value = "qwer";
    assert.equal(model.foo, "qwer");
});

test.run();
