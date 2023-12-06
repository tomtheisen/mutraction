import { effect, track, defaultTracker as tracker, Tracker } from '../src/index.js';
import { test } from 'uvu';
import * as assert from 'uvu/assert';

test('undo delete redo', () => {
    const tr = new Tracker;
    const tx = tr.startTransaction();
    const model = tr.track({ foo: "bar", x: 123 } as any);

    delete model.foo;
    assert.not("foo" in model);
    assert.equal(tx.operations.length, 1);

    tr.undo();
    assert.is(model.foo, "bar");

    tr.redo();
    assert.not("foo" in model);
});

test('array extend', () => {
    const tr = new Tracker;
    const tx = tr.startTransaction();

    const model = tr.track([1] as any);

    model[0] = 4;
    model[2] = 3;
    assert.equal(model, [4, , 3]);
    
    tr.undo();
    assert.equal(model, [4]);
    
    tr.redo();
    assert.equal(model, [4, , 3]);
});

test('array shift rollback test', () => {
    const tr = new Tracker;
    const tx = tr.startTransaction();

    const model = tr.track(['a','b','c'] as any);

    model.shift();
    assert.equal(model, ['b', 'c']);

    tr.rollback();
    assert.equal(model, ['a', 'b', 'c']);
});

test('arguments untrackable', () => {
    const model = track({whatever: 'x'} as any);

    assert.throws(function() { model.some = arguments; });
});

test('instanceof', () => {
    class C {}

    const model = track(new C);

    assert.ok(model instanceof C);
});

test('no symbol key leakage', () => {
    const model = track({} as any);

    model.foo = 1;

    assert.equal(Object.keys(model), ["foo"]);
});

test('no history', () => {
    const tr = new Tracker({ autoTransactionalize: false });
    // const tx = tr.startTransaction();

    const model = tr.track({} as any);

    model.foo = 7;
    assert.throws(() => tr.undo());
    assert.equal(model.foo, 7);

    // tr.rollback();
});

test('callback immediate', () => {
    const tr = new Tracker();
    const model = tr.track({a: 99, b: 88} as any);
    let callbacks = 0;
    effect(() => {
        [model.a, model.b];
        ++callbacks;
    }, { tracker: tr });
    assert.equal(callbacks, 1);

    model.a = 1;
    model.b = 2;

    assert.equal(callbacks, 3);
});

test('undo notifies', () => {
    const tr = new Tracker();
    const tx = tr.startTransaction();

    const model = tr.track({ current: 0 });

    let cached = -1;
    effect(() => { cached = model.current; }, { tracker: tr });

    model.current = 1;
    model.current = 2;
    tr.undo();

    tr.commit(tx);

    assert.equal(cached, 1);
});

test('undo delete notifies', () => {
    const tr = new Tracker();

    const model = tr.track({ foo: 123 } as any);

    let cached: any;
    effect(() => { cached = model.foo; }, { tracker: tr });
    assert.equal(cached, 123);

    const tx = tr.startTransaction();

    model.foo = 234;
    assert.equal(cached, 123);

    delete model.foo;
    assert.equal(cached, 123);
    tr.undo();

    tr.commit(tx);

    assert.equal(cached, 234);
});

test.run();
