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

test.run();