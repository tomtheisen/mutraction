import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { track, untrack, isTracked } from '../index.js';

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
    assert.equal(model, [], "was emptied");
    
    tracker.rollback();
    assert.equal(model, ['a', 'b', 'c'], "came back");
});

test('arguments untrackable', () => {
    const [model, tracker] = track({whatever: 'x'} as any);

    assert.throws(function() { model.some = arguments; });
});

test('detach', () => {
    const [model, tracker] = track({whatever: 'x'} as any);

    model.zxcv = 213;
    assert.is(1, tracker.history.length);
    assert.ok(isTracked(model))

    let original = untrack(model) as any;
    model.asdf = 555;
    assert.is(1, tracker.history.length);
    assert.not.ok(isTracked(original));
});

test('instanceof', () => {
    class C {}

    const [model] = track(new C);

    assert.ok(model instanceof C);
});

test('no symbol key leakage', () => {
    const [model] = track({} as any);

    model.foo = 1;

    assert.equal(Object.keys(model), ["foo"]);
});

test('clear history', () => {
    const [model, tracker] = track({} as any);

    model.a = 1;
    model.b = 2;

    tracker.undo();
    tracker.clearHistory();
    assert.equal(model, {a: 1});

    tracker.undo();
    assert.equal(model, {a: 1});

    tracker.redo();
    assert.equal(model, {a: 1});
});

test.run();
