import { track, defaultTracker as tracker, isTracked, Tracker, effect, defaultTracker } from '../src/index.js';
import { test } from 'uvu';
import * as assert from 'uvu/assert';
import type { DependencyList } from '../src/dependency.js';

function assertDependencies(dep: DependencyList, expected: [obj: object, prop: string][]) {
    assert.equal(dep.trackedProperties.length, expected.length, "Unexpected dependency size");

    for (const act of dep.trackedProperties) {
        assert.ok(
            expected.some(exp => act.object === exp[0] && act.prop === exp[1]),
            "Unexpected dependency prop: " + String(act.prop));
    } 
}

test('track inner dep', () => {
    const model = track({ foo: "bar", inner: { leaf1: 4, leaf2: 45 } } as any);

    let dt1 = tracker.startDependencyTrack();
    model.foo;
    assertDependencies(dt1, [[model,"foo"]]);

    let dt2 = tracker.startDependencyTrack();
    model.inner.leaf1;
    model.inner.leaf2;
    dt2.endDependencyTrack();
    assertDependencies(dt2, [[model,"inner"], [model.inner,"leaf1"], [model.inner,"leaf2"]]);

    dt1.endDependencyTrack();
    assert.throws(() => dt1.endDependencyTrack());
});

test('inner change does not increase outer dependency generation', () => {
    const model = track({ foo: { leaf1: 4, leaf2: 45 }, inner: "bar" } as any);

    let d1 = tracker.startDependencyTrack();
    let foo = model.foo;
    d1.endDependencyTrack();
    assertDependencies(d1, [[model, "foo"]]);
    assert.ok(isTracked(foo), "inner object is tracked");

    let d2 = tracker.startDependencyTrack();
    foo.leaf1;
    d2.endDependencyTrack();
    assertDependencies(d2,[[foo, "leaf1"]]);

    let c1 = 0, c2 = 0;
    d1.subscribe(() => ++c1);
    d2.subscribe(() => ++c2);

    model.foo = model.foo;

    assert.equal(c1, 1, "first tracker generation changed");
    assert.equal(c2, 0, "second tracker generation did not change");

    foo.leaf1 = "squizzblaster";
    model.crumpets = "fuzzy";

    assert.equal(c1, 1, "first tracker generation did not change");
    assert.equal(c2, 1, "second tracker generation changed");
});

test('history dependency', () => {
    const tr = new Tracker;
    const model = tr.track({} as any);

    
    let c = 0;
    const sub = tr.subscribe(() => ++c);

    assert.equal(c, 0);

    model.foo = {};
    assert.equal(c, 1);

    model.foo.bar = {};
    assert.equal(c, 2);
});

test('only top dependency notified', () => {
    const model = track({a:0, b:0, c:0});

    const d1 = tracker.startDependencyTrack();
    model.a;
    const d2 = tracker.startDependencyTrack();
    model.b;
    d2.endDependencyTrack();
    model.c;
    d1.endDependencyTrack();

    assert.equal(d1.trackedProperties.length, 2);
    assert.equal(d2.trackedProperties.length, 1);
});

test('array extend undo length dep', () => {
    const tr = new Tracker;

    const model = tr.track([99]);

    let runs = 0;
    effect(() => {
        [model.length];
        ++runs;
    }, { tracker: tr });
    assert.equal(runs, 1);

    const tx = tr.startTransaction();
    model[1] = 77;
    tr.undo();
    assert.equal(model, [99]);

    tr.redo();
    tr.commit(tx);

    assert.equal(model, [99, 77]);
    assert.equal(runs, 2);
});

test.run();