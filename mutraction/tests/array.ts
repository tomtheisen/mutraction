import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { track, trackAsReadonlyDeep, isTracked, effect } from '../index.js';

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
    const [arr] = track([]);

    assert.ok(isTracked(arr));
    assert.ok(Array.isArray(arr));
});

test('no history arrays', () => {
    const [arr] = track([1], { trackHistory: false });

    arr.push(2);

    assert.ok(isTracked(arr));
    assert.equal(arr, [1, 2]);
});

test('array lengthen', () => {
    const [arr] = track([]);

    arr.length = 10;
    assert.equal(arr.length, 10);
});

test('action log recipe', () => {
    const [model, tracker] = trackAsReadonlyDeep(
        { arr: [1,2,3], add(n: number) { this.arr.push(n) } },
        { autoTransactionalize: true });

    model.add(5);
    assert.snapshot(
        JSON.stringify(tracker.history),
        `[{"type":"transaction","operations":[{"type":"arrayextend","target":[1,2,3,5],"name":"3","oldLength":3,"newIndex":3,"newValue":5}],"transactionName":"add"}]`
    );
});

test('array pop length visible in effect', () => {
    const[model, tracker] = track([1,2,3]);

    let length = 0;
    effect(tracker, () => { length = model.length; });

    model.pop();

    assert.equal(length, 2);
});

test.run();
