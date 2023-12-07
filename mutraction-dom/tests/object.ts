import { track, defaultTracker as tracker, effect, Tracker, isTracked } from '../src/index.js';
import { test } from 'uvu';
import * as assert from 'uvu/assert';

test('state methods', () => {
    class C {
        prop = 0;
        setProp(val: number) { this.prop = val; }
        getProp() { return this.prop; }
    }
    
    const tr = new Tracker;
    const tx = tr.startTransaction();
    
    const model = tr.track(new C);

    model.setProp(7);
    assert.equal(model.getProp(), 7);

    model.setProp(12);
    assert.equal(model.getProp(), 12);

    tr.undo();
    assert.equal(model.getProp(), 7);
});

test('compound setter records only leaf operations', () => {
    const tr = new Tracker;
    const tx = tr.startTransaction();
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

    const model = tr.track(new C(4));

    tr.startTransaction();
    model.prop = 5;
    tr.commit();
    assert.equal(model._maxProp, 5);

    assert.equal(tx.operations.length, 1);
    assert.equal(tx.operations[0].type, "transaction");
    assert.equal(tx.operations[0].type === "transaction" && tx.operations[0].operations.length, 2);

    tr.undo();
    assert.equal(model._maxProp, 4);
});

test('auto transact', () => {
    const tr = new Tracker({ autoTransactionalize: true });
    const tx = tr.startTransaction();

    class C {
        a = 1;
        b = 2;
        c = 3;
        incrementAll() { (this.a++, this.b++, this.c++); }
    }

    const model = tr.track(new C);

    model.b = 12;
    model.incrementAll();
    assert.equal({ ...model }, { a:2, b:13, c:4 });

    tr.undo();
    assert.equal({ ...model }, { a:1, b:12, c:3 });
});

test('no promises', () => {
    const model = track({
        o1: { foo: 231 },
        o2: Promise.resolve(231),
    });

    assert.ok(isTracked(model.o1));
    assert.not.ok(isTracked(model.o2));
});

test('check for existing proxy', () => {
    const o = { x : 5 };

    const model = track({ a: o, b: o });

    assert.is(model.a, model.b);
});

test.run();

