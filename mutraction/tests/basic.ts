import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { track } from '../src/index.js';

test('undo delete redo', () => {
    const [model, tracker] = track({ foo: "bar", x: 123 } as any);

    delete model.foo;
    assert.not("foo" in model);

    tracker.undo();
    assert.is(model.foo, "bar");

    tracker.redo();
    assert.not("foo" in model);
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

test('array shift rollback test', () => {
    const [model, tracker] = track(['a','b','c'] as any);

    model.shift();
    assert.equal(model, ['b', 'c']);
    
    tracker.rollback();
    assert.equal(model, ['a', 'b', 'c']);
});

test('arguments untrackable', () => {
    const [model] = track({whatever: 'x'} as any);

    assert.throws(function() { model.some = arguments; });
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

test('no history', () => {
    const [model, tracker] = track({} as any, { trackHistory: false });

    model.foo = 7;
    assert.throws(() => tracker.undo(), "undo should throw");
    assert.throws(() => tracker.redo(), "redo should throw");
    assert.throws(() => tracker.commit(), "commit should throw");
    assert.throws(() => tracker.rollback(), "rollback should throw");
    assert.equal(model.foo, 7);
});

test('no history but auto', () => {
    assert.throws(() => track({}, { trackHistory: false, autoTransactionalize: true }));
});

test('callback deferral', async () => {
    await new Promise((resolve, reject) => {
        const [model, tracker] = track({} as any, { deferNotifications: true });
        let callbacks = 0;
        tracker.subscribe(() => ++callbacks);
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
    const [model, tracker] = track({} as any, { deferNotifications: false });
    let callbacks = 0;
    tracker.subscribe(() => ++callbacks);
    model.a = 1;
    model.b = 2;

    assert.equal(callbacks, 2);
});

test.run();
