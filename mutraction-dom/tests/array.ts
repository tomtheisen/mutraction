import { track, isTracked, effect, defaultTracker as tracker, Tracker } from '../src/index.js';
import { test } from 'uvu';
import * as assert from 'uvu/assert';

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

    assert.equal(tx.dependencies.size, 1);
    assert.equal([...tx.dependencies][0].prop, "length");
});

test('array pop length visible in effect', () => {
    const model = track([1,2,3]);

    let length = 0;
    effect(() => { length = model.length; }, { tracker });

    model.pop();

    assert.equal(length, 2);
});

test.run();
