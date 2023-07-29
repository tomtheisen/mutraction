import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { track, untrack, isTracked } from '../index.js';

test('state methods', () => {
    class C {
        prop = 0;
        setProp(val: number) { this.prop = val; }
        getProp() { return this.prop; }
    }

    const [model, tracker] = track(new C);

    model.setProp(7);
    assert.equal(model.getProp(), 7);

    model.setProp(12);
    assert.equal(model.getProp(), 12);

    tracker.undo();
    assert.equal(model.getProp(), 7);
});

test('compound setter records only leaf operations', () => {
    class C {
        _maxProp: number;
        _prop: number;

        constructor(value: number) {
            this._prop = this._maxProp = value;
        }

        get prop() { return this._prop; }
        set prop(value: number) {
            this._maxProp = Math.max(value, this._maxProp);
            this._prop = value;
        }
    }

    const [model, tracker] = track(new C(4));

    tracker.startTransaction();
    model.prop = 5;
    tracker.commit();
    assert.equal(model._maxProp, 5);

    assert.equal(tracker.history.length, 1);
    assert.equal(tracker.history[0].type, "transaction");
    assert.equal(tracker.history[0].type === "transaction" && tracker.history[0].operations.length, 2);

    tracker.undo();
    assert.equal(model._maxProp, 4);
});

test('auto transact', () => {
    class C {
        a = 1;
        b = 2;
        c = 3;
        incrementAll() { (this.a++, this.b++, this.c++); }
    }

    const [model, tracker] = track(new C, { autoTransactionalize: true });

    model.b = 12;
    model.incrementAll();
    assert.equal({ ...model }, { a:2, b:13, c:4 });

    tracker.undo();
    assert.equal({ ...model }, { a:1, b:12, c:3 });
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
})

test.run();

