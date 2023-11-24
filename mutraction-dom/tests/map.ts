import { track, defaultTracker as tracker, effect, Tracker, isTracked, defaultTracker } from '../src/index.js';
import { test } from 'uvu';
import * as assert from 'uvu/assert';

test('existing mutable map keys prohibited', () => {
    assert.throws(() => {
        track(new Map([[{ current: 123 }, "zxcv"]]));
    });
});

test('new mutable map keys prohibited', () => {
    const m = track(new Map<{ current: string }, number>);
    assert.throws(() => {
        m.set({ current: "zxcv" }, 432);
    });
});

test('map size subscription', () => {
    const model = track(new Map<string, string>([["a", "x"]]));

    let size = 0;
    effect(() => { size = model.size; });

    model.set("b", "y");
    model.set("c", "z");
    assert.equal(size, 3);

    model.delete("b");
    assert.equal(size, 2);
});

test.run();
