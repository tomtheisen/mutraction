import { track, defaultTracker as tracker, effect, Tracker, defaultTracker, createOrRetrievePropRef } from '../src/index.js';
import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { Transaction } from '../src/types.js';

test('basic transaction works', () => {
    const model = track({foo: "bar"});

    defaultTracker.startTransaction();
    model.foo = "baz";
    defaultTracker.commit();
});

test('nested transaction works', () => {
    const model = track({foo: "bar"});

    defaultTracker.startTransaction();
    defaultTracker.startTransaction();
    model.foo = "baz";
    defaultTracker.commit();
    defaultTracker.commit();
});

test('array push and transaction', () => {
    const tr = new Tracker;

    const model = tr.track([] as any);

    tr.startTransaction();
    model.push(4);
    tr.commit();
    tr.startTransaction();
    model.push(7);
    tr.commit();
    assert.equal(model, [4,7], "two pushes");
});

test('committed transaction has no parent', () => {
    const tr = new Tracker;
    const model = tr.track({} as any);
    
    const tx = tr.startTransaction();
    model.lol = 132;
    tr.commit();

    assert.ok(tx);
    assert.equal(tx.depth, 1);
});

test('transaction without history', () => {
    const tr = new Tracker();
    const model = tr.track({ x: 1 });

    tr.startTransaction();
    model.x = 2;
    model.x = 3;
    tr.commit();

    assert.equal(model.x, 3);
});

test('set transaction collapsing', () => {
    const tr = new Tracker;
    const tx = tr.startTransaction();
    const model = tr.track(new Set([1]));

    tr.startTransaction();
    model.add(3);
    model.add(5);
    model.delete(5);
    model.delete(3);
    tr.commit();

    console.log();
    assert.equal(model, new Set([1]));
});

test('map transaction collapsing', () => {
    const tr = new Tracker;
    const tx = tr.startTransaction();
    const model = tr.track(new Map<string, string>);

    tr.startTransaction();
    model.set("a", "b");
    model.set("a", "c");
    model.delete("a");
    tr.commit();

    assert.equal(model, new Map);
});


test.run();

