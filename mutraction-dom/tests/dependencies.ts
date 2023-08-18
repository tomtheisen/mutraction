import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { track, isTracked } from '../src/index.js';
import { DependencyList } from '../src/dependency.js';

function assertDependencies(dep: DependencyList, expected: [obj: object, prop: string][]) {
    assert.equal(dep.trackedProperties.length, expected.length, "Unexpected dependency size");

    for (const act of dep.trackedProperties) {
        assert.ok(
            expected.some(exp => act.object === exp[0] && act.prop === exp[1]),
            "Unexpected dependency prop: " + String(act.prop));
    } 
}

test('track inner dep', () => {
    const [model, tracker] = track({ foo: "bar", inner: { leaf1: 4, leaf2: 45 } } as any);

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
    const [model, tracker] = track({ foo: { leaf1: 4, leaf2: 45 }, inner: "bar" } as any);

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
    const [model, tracker] = track({} as any);

    const dep = tracker.startDependencyTrack();
    // establish history dependency
    const history = tracker.history;
    dep.endDependencyTrack();

    let c = 0;
    dep.subscribe(() => ++c);

    assert.equal(history.length, 0);
    assert.equal(c, 0);

    model.foo = {}; // 1
    model.foo.bar = {}; // 2
    tracker.undo(); // 3
    assert.equal(c, 3);
});

test('only top dependency notified', () => {
    const [model, tracker] = track({a:0, b:0, c:0});

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

test.run();