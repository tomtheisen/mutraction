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
    const model = track([] as any);

    tracker.startTransaction();
    model.push(4);
    tracker.commit();
    tracker.startTransaction();
    model.push(7);
    tracker.commit();
    assert.equal(model, [4,7], "two pushes");

    tracker.undo();
    assert.equal(model, [4], "undo push");

    tracker.undo();
    assert.equal(model, [], "undo another push");
});

test('committed transaction has no parent', () => {
    const tr = new Tracker;
    const model = tr.track({} as any);
    
    const tx = tr.startTransaction();
    model.lol = 132;
    tr.commit();

    assert.ok(tx);
    assert.not.ok(tx.parent);
});

test('array length 0 rollback test', () => {
    const model = track(['a','b','c'] as any);

    model.length = 0;
    assert.equal(model, [], "was emptied");
    
    tracker.rollback();
    assert.equal(model, ['a', 'b', 'c'], "came back");
});

test('transaction does not obscure history', () => {
    const tr = new Tracker;
    const tx = tr.startTransaction();
    const model = tr.track({} as any);

    model.asdf = 123;
    tr.startTransaction();
    assert.equal(tx.operations.length, 1);
});

test('transaction out of order resolution fails', () => {
    const tr = new Tracker;
    tr.track({} as any);

    const t1 = tr.startTransaction();
    const t2 = tr.startTransaction();
    assert.throws(() => tr.commit(t1));
    tr.commit(t2);
});

test('no auto rollback on throw', () => {
    const tr = new Tracker({autoTransactionalize: true});
    const model = tr.track({
        p: 3,
        m() { this.p = 4; throw 'fail'; }
    });

    assert.throws(() => model.m());
    assert.equal(model.p, 4);
});

test('auto rollback on empty', () => {
    const tr = new Tracker({autoTransactionalize: true});
    const tx = tr.startTransaction();
    const model = tr.track({
        x: 4,
        m() { }
    });

    model.m();
    assert.equal(tx.operations.length, 0);
});

test('compact into nothing', () => {
    const tr = new Tracker;
    const model = tr.track({foo: 45} as any);

    const tx = tr.startTransaction("noop");
    model.x = 1;
    model.x = 2;
    delete model.x;
    tr.commit();

    assert.equal(tx, { 
        transactionName: "noop", 
        type:'transaction', 
        parent: undefined, 
        operations: [], 
        dependencies: new Set([createOrRetrievePropRef(model, "x")]),
        timestamp: tx.timestamp,
    });
});

test('compound noop', () => {
    const tr = new Tracker;
    const model = tr.track({foo: 45} as any);
    const tx = tr.startTransaction();

    tr.startTransaction("noop2");
    model.foo = 99;
    model.x = 1;
    model.x = 2;
    delete model.x;
    model.foo = 45;
    tr.commit();

    assert.equal(tx.operations, []);
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
    assert.equal(tx.operations[0].type, "transaction");
    assert.equal((tx.operations[0] as Transaction).operations.length, 0);
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
    assert.equal(tx.operations[0].type, "transaction");
    assert.equal((tx.operations[0] as Transaction).operations.length, 0);
});


test.run();

