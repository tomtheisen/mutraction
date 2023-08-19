import { track, defaultTracker as tracker, Tracker } from '../src/index.js';
import { test } from 'uvu';
import * as assert from 'uvu/assert';

test('undo delete redo', () => {
    const model = track({ foo: "bar", x: 123 } as any);

    delete model.foo;
    assert.not("foo" in model);

    tracker.undo();
    assert.is(model.foo, "bar");

    tracker.redo();
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
    const tr = new Tracker({ trackHistory: false });
    const model = tr.track({} as any);

    model.foo = 7;
    assert.throws(() => tr.undo(), "undo should throw");
    assert.throws(() => tr.redo(), "redo should throw");
    assert.throws(() => tr.commit(), "commit should throw");
    assert.throws(() => tr.rollback(), "rollback should throw");
    assert.equal(model.foo, 7);
});

test('no history but auto', () => {
    assert.throws(() => new Tracker({ trackHistory: false, autoTransactionalize: true }));
});

test('callback deferral', async () => {
    await new Promise((resolve, reject) => {
        const tr = new Tracker({ deferNotifications: true });

        const model = tr.track({} as any);
        let callbacks = 0;
        tr.subscribe(() => ++callbacks);
        model.a = 1;
        model.b = 2;

        // callbacks didn't happen yet
        assert.equal(callbacks, 0);

        setTimeout(() => {
            // but now they did
            assert.equal(callbacks, 2);
            resolve(undefined);
        }, 1);
    });
});

test('callback immediate', () => {
    const tr = new Tracker({ deferNotifications: false });
    const model = tr.track({} as any);
    let callbacks = 0;
    tr.subscribe(() => ++callbacks);
    model.a = 1;
    model.b = 2;

    assert.equal(callbacks, 2);
});

test.run();
