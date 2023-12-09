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
    
    const model = tr.track(new C);

    model.setProp(7);
    assert.equal(model.getProp(), 7);

    model.setProp(12);
    assert.equal(model.getProp(), 12);
});

test('auto transact', () => {
    const tr = new Tracker({ autoTransactionalize: true });

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

