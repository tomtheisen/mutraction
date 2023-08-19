import { track, defaultTracker as tracker, effect, Tracker } from '../src/index.js';
import { test } from 'uvu';
import * as assert from 'uvu/assert';

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
    
    tr.startTransaction();
    model.lol = 132;
    tr.commit();

    const transaction = tr.history[0] as any;
    assert.ok(transaction);
    assert.is(transaction.type, "transaction");
    assert.not.ok(transaction.parent);
});

test('array length 0 rollback test', () => {
    const model = track(['a','b','c'] as any);

    model.length = 0;
    assert.equal(model, [], "was emptied");
    
    tracker.rollback();
    assert.equal(model, ['a', 'b', 'c'], "came back");
});

test('transaction does not obscure history', () => {
    const model = track({} as any);

    model.asdf = 123;
    tracker.startTransaction();
    assert.equal(tracker.history.length, 1);
});

test('transaction out of order resolution fails', () => {
    const tr = new Tracker;
    tr.track({} as any);

    const t1 = tr.startTransaction();
    const t2 = tr.startTransaction();
    assert.throws(() => tr.commit(t1));
    tr.commit(t2);
});

test('auto rollback on throw', () => {
    const tr = new Tracker({autoTransactionalize: true});
    const model = tr.track({
        p: 3,
        m() { this.p = 4; throw 'fail'; }
    });

    assert.throws(() => model.m());
    assert.equal(model.p, 3);
});

test('auto rollback on empty', () => {
    const tr = new Tracker({autoTransactionalize: true});
    const model = tr.track({
        x: 4,
        m() { }
    });

    model.m();
    assert.equal(tr.history.length, 0);
});

test('compact into nothing', () => {
    const tr = new Tracker;
    const model = tr.track({foo: 45} as any);

    tr.startTransaction("noop");
    model.x = 1;
    model.x = 2;
    delete model.x;
    tr.commit();

    assert.equal(tr.history, [{ transactionName: "noop", type:'transaction', parent: undefined, operations: []}]);
});

test('compound noop', () => {
    const tr = new Tracker;
    const model = track({foo: 45} as any);

    tr.startTransaction("noop2");
    model.foo = 99;
    model.x = 1;
    model.x = 2;
    delete model.x;
    model.foo = 45;
    tr.commit();

    assert.equal(tr.history, [{ transactionName: "noop2", type:'transaction', parent: undefined, operations: []}]);
});

test.run();

