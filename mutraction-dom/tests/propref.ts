import { track, defaultTracker as tracker, defaultTracker } from '../src/index.js';
import { test } from 'uvu';
import * as assert from 'uvu/assert';

test('shallow prop ref', () => {
    const model = track({ foo: { bar: 1 } });
    
    const pr = tracker.getPropRef(() => model.foo);

    assert.is(pr.object, model, "propref object is just the model");
    assert.equal(pr.prop, "foo", "propref prop name is foo");

    let val = pr.current;
    assert.is(val, model.foo, "value of propref is model.foo");

    pr.current = { bar: 55 };
    assert.equal(model.foo, { bar: 55 }, "assigned value to propref reflected in model");
});

test('compound prop ref', () => {
    const model = track({ foo: { bar: 1 } });
    
    const pr = tracker.getPropRef(() => model.foo.bar);

    assert.is(pr.object, model.foo);
    assert.equal(pr.prop, "bar");
});

test('get prop ref makes no dependency', () => {
    const model = track({ x: "y" });

    const dep = defaultTracker.startDependencyTrack();
    const pr = defaultTracker.getPropRef(() => model.x);
    dep.endDependencyTrack();

    assert.equal(dep.trackedProperties.length, 0);
    assert.equal(pr.prop, "x");
});

test('get prop ref does not include implementation of getters', () => {
    class C {
        first = "abc";
        last = "zxcv";
        get full() { return `${this.first} ${this.last}` }
    }
    
    const model = track(new C);
    const pr = defaultTracker.getPropRef(() => model.full); 

    assert.equal(pr.prop, "full");
});

test.run();
