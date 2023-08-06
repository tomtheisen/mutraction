import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { track, trackAsReadonlyDeep, isTracked } from '../index.js';

test('array push and transaction', () => {
    const [model, tracker] = track([] as any);

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
    let [model, tracker] = track({} as any);
    
    tracker.startTransaction();
    model.lol = 132;
    tracker.commit();

    const transaction = tracker.history[0] as any;
    assert.ok(transaction);
    assert.is(transaction.type, "transaction");
    assert.not.ok(transaction.parent);
});

test('array length 0 rollback test', () => {
    const [model, tracker] = track(['a','b','c'] as any);

    model.length = 0;
    assert.equal(model, [], "was emptied");
    
    tracker.rollback();
    assert.equal(model, ['a', 'b', 'c'], "came back");
});

test('transaction does not obscure history', () => {
    const [model, tracker] = track({} as any);

    model.asdf = 123;
    tracker.startTransaction();
    assert.equal(tracker.history.length, 1);
});

test('transaction out of order resolution fails', () => {
    const [model, tracker] = track({} as any);

    const t1 = tracker.startTransaction();
    const t2 = tracker.startTransaction();
    assert.throws(() => tracker.commit(t1));
});

test('auto rollback on throw', () => {
    const [model] = track({
        p: 3,
        m() { this.p = 4; throw 'fail'; }
    }, {autoTransactionalize: true});

    assert.throws(() => model.m());
    assert.equal(model.p, 3);
});

test('auto rollback on empty', () => {
    const [model, tracker] = track({
        x: 4,
        m() { }
    }, {autoTransactionalize: true});

    model.m();
    assert.equal(tracker.history.length, 0);
});

test('compact into nothing', () => {
    const [model, tracker] = track({foo: 45} as any);

    tracker.startTransaction("noop");
    model.x = 1;
    model.x = 2;
    delete model.x;
    tracker.commit();

    assert.equal(tracker.history, [{ transactionName: "noop", type:'transaction', parent: undefined, operations: []}]);
});

test('compound noop', () => {
    const [model, tracker] = track({foo: 45} as any);

    tracker.startTransaction("noop2");
    model.foo = 99;
    model.x = 1;
    model.x = 2;
    delete model.x;
    model.foo = 45;
    tracker.commit();

    assert.equal(tracker.history, [{ transactionName: "noop2", type:'transaction', parent: undefined, operations: []}]);
});

test.run();

