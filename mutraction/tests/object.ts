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

test('private property with accessors', () => {
    class C {
        #prop = 0;
        setProp(val: number) { this.#prop = val; }
        getProp() { return this.#prop; }
    }

    const [model, tracker] = track(new C);

    model.setProp(7);
    assert.equal(model.getProp(), 7);

    model.setProp(12);
    assert.equal(model.getProp(), 12);

    // https://github.com/tc39/proposal-class-fields/issues/106#issuecomment-397385661

    tracker.undo();
    assert.equal(model.getProp(), 7);
});


test.run();