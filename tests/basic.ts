import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { track } from '../src/mutraction';

test('undo delete redo', () => {
    const [model, tracker] = track({ foo: "bar", x: 123 } as any);

    delete model.foo;
    assert.not("foo" in model);

    tracker.undo();
    assert.is(model.foo, "bar");

    tracker.redo();
    assert.not("foo" in model);
});

test('array', () => {
    const [model, tracker] = track([] as any);

    model.push(4);
    model.push(7);
    assert.equal(model, [4,7]);

    tracker.undo();
    assert.equal(model, [4]);

    tracker.undo();
    assert.equal(model, []);
});

test('array extend', () => {
    let [model, tracker] = track([1] as any);

    model[0] = 4;
    model[2] = 3;
    assert.equal(model, [4, , 3]);
    
    tracker.undo();
    assert.equal(model, [4]);
    
    tracker.redo();
    assert.equal(model, [4, , 3]);
});

test.run();
