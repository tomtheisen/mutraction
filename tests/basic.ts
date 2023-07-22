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

test('array push and transaction', () => {
    const [model, tracker] = track([] as any);

    tracker.startTransaction();
    model.push(4);
    tracker.commit();
    tracker.startTransaction();
    model.push(7);
    tracker.commit();
    assert.equal(model, [4,7], "two pushes");

    tracker.undo();
    assert.equal(model, [4], "undo push");

    tracker.undo();
    assert.equal(model, [], "undo another push");
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

test('committed transaction has no parent', () => {
    let [model, tracker] = track({} as any);
    
    tracker.startTransaction();
    model.lol = 132;
    tracker.commit();

    const transaction = tracker.history[0] as any;
    assert.ok(transaction);
    assert.is(transaction.type, "transaction");
    assert.not.ok(transaction.parent);
});

test('array shift rollback test', () => {
    const [model, tracker] = track(['a','b','c'] as any);

    model.shift();
    assert.equal(model, ['b', 'c']);
    
    tracker.rollback();
    assert.equal(model, ['a', 'b', 'c']);
});

test('array length 0 rollback test', () => {
    const [model, tracker] = track(['a','b','c'] as any);

    model.length = 0;
    assert.equal(model, []);
    
    tracker.rollback();
    assert.equal(model, ['a', 'b', 'c']);
});

test.run();
