import { effect, track, defaultTracker as tracker, Tracker } from '../src/index.js';
import { test } from 'uvu';
import * as assert from 'uvu/assert';

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

test.run();
