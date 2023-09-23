import { effect, track, defaultTracker as tracker, Tracker } from '../src/index.js';
import { test } from 'uvu';
import * as assert from 'uvu/assert';

test('undo delete redo', () => {
    const tr = new Tracker;
    const model = tr.track({ foo: "bar", x: 123 } as any);

    delete model.foo;
    assert.not("foo" in model);
    assert.equal(tr.history.length, 1);

    tr.undo();
    assert.is(model.foo, "bar");

    tr.redo();
    assert.not("foo" in model);
});

test('array extend', () => {
    const model = track([1] as any);

    model[0] = 4;
    model[2] = 3;
    assert.equal(model, [4, , 3]);
    
    tracker.undo();
    assert.equal(model, [4]);
    
    tracker.redo();
    assert.equal(model, [4, , 3]);
});

test('array shift rollback test', () => {
    const model = track(['a','b','c'] as any);

    model.shift();
    assert.equal(model, ['b', 'c']);

    tracker.rollback();
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

test('clear history', () => {
    const model = track({} as any);

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

test('no history', () => {
    const tr = new Tracker({ trackHistory: false, autoTransactionalize: false });
    const model = tr.track({} as any);

    model.foo = 7;
    assert.throws(() => tr.undo(), "undo should throw");
    assert.throws(() => tr.redo(), "redo should throw");
    assert.throws(() => tr.commit(), "commit should throw");
    assert.equal(model.foo, 7);

    tr.rollback();
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
    const model = tr.track({ current: 0 });

    let cached = -1;
    effect(() => { cached = model.current; }, { tracker: tr });

    model.current = 1;
    model.current = 2;
    assert.equal(cached, 2);

    tr.undo();
    assert.equal(cached, 1);
});

test('undo delete notifies', () => {
    const tr = new Tracker();
    const model = tr.track({ foo: 123 } as any);

    let cached: any;
    effect(() => { cached = model.foo; }, { tracker: tr });

    assert.equal(cached, 123);

    delete model.foo;
    assert.equal(cached, undefined);

    tr.undo();
    assert.equal(cached, 123);
});

test.run();
