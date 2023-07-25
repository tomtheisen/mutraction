import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { track, untrack, isTracked } from '../index.js';

test('array sort undo', () => {
    const [arr, tracker] = track(["a","c","b"]);

    tracker.startTransaction();
    arr.sort();
    tracker.commit();
    assert.equal(arr, ["a", "b", "c"]);

    tracker.undo();
    assert.equal(arr, ["a", "c", "b"]);
});

test('array atomicity', () => {
    const [arr, tracker] = track([3, 4]);

    arr.push(8);
    arr.push(6, 7);
    tracker.undo();
    assert.equal(arr, [3, 4, 8]);
});

test('array detection', () => {
    const [arr, tracker] = track([]);

    assert.ok(isTracked(arr));
    assert.ok(Array.isArray(arr));
});

test.run();