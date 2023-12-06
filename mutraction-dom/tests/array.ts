import { track, isTracked, effect, defaultTracker as tracker, Tracker } from '../src/index.js';
import { test } from 'uvu';
import * as assert from 'uvu/assert';

test('array sort undo', () => {
    const tr = new Tracker;
    const tx = tr.startTransaction();
    
    const arr = tr.track(["a","c","b"]);

    tr.startTransaction();
    arr.sort();
    tr.commit();
    assert.equal(arr, ["a", "b", "c"]);

    tr.undo();
    assert.equal(arr, ["a", "c", "b"]);
});

test('array atomicity', () => {
    const tr = new Tracker;
    const tx = tr.startTransaction();

    const arr = tr.track([3, 4]);

    arr.push(8);
    arr.push(6, 7);
    tr.undo();
    assert.equal(arr, [3, 4, 8]);
});

test('array detection', () => {
    const arr = track([]);

    assert.ok(isTracked(arr));
    assert.ok(Array.isArray(arr));
});

test('no history arrays', () => {
    const tr = new Tracker({ autoTransactionalize: false })
    const arr = tr.track([1]);

    arr.push(2);

    assert.ok(isTracked(arr));
    assert.equal(arr, [1, 2]);
});

test('array lengthen', () => {
    const arr = track([]);

    arr.length = 10;
    assert.equal(arr.length, 10);
});

test('action log recipe', () => {
    const tr = new Tracker({ autoTransactionalize: true });

    const tx = tr.startTransaction();

    const model = tr.trackAsReadonlyDeep({ 
        arr: [1,2,3], 
        add(n: number) { this.arr.push(n) } 
    });

    model.add(5);

    const operation = tx.operations[0];
    assert.equal(operation.type, "transaction");
    assert.equal(operation.type === "transaction" && operation.transactionName, "add");

});

test('array pop length visible in effect', () => {
    const model = track([1,2,3]);

    let length = 0;
    effect(() => { length = model.length; }, { tracker });

    model.pop();

    assert.equal(length, 2);
});

test.run();
