import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { track, isTracked } from '../index.js';
import { DependencyList } from '../src/dependency.js';

function assertDependencies(dep: DependencyList, expected: [obj: object, prop: string][]) {
    assert.equal(dep.trackedProperties.size, expected.length, "Unexpected dependency size");

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

    let dt1 = tracker.startDependencyTrack();
    let foo = model.foo;
    dt1.endDependencyTrack();
    assertDependencies(dt1, [[model, "foo"]]);
    assert.ok(isTracked(foo), "inner object is tracked");

    let dt2 = tracker.startDependencyTrack();
    foo.leaf1;
    dt2.endDependencyTrack();
    assertDependencies(dt2,[[foo, "leaf1"]]);

    const g1_1 = dt1.getLatestChangeGeneration();
    const g2_1 = dt2.getLatestChangeGeneration();

    model.foo = model.foo;

    const g1_2 = dt1.getLatestChangeGeneration();
    const g2_2 = dt2.getLatestChangeGeneration();

    assert.ok(g1_1 < g1_2, "first tracker generation changed");
    assert.ok(g2_1 === g2_2, "second tracker generation did not change");

    foo.leaf1 = "squizzblaster";
    model.crumpets = "fuzzy";

    const g1_3 = dt1.getLatestChangeGeneration();
    const g2_3 = dt2.getLatestChangeGeneration();

    assert.ok(g1_2 === g1_3, "first tracker generation did not change");
    assert.ok(g2_2 < g2_3, "second tracker generation changed");
});

test('history dependency', () => {
    const [model, tracker] = track({} as any);

    const dep = tracker.startDependencyTrack();
    // establish history dependency
    const history = tracker.history;
    dep.endDependencyTrack();

    assert.equal(history.length, 0);
    assert.equal(dep.getLatestChangeGeneration(), 0);

    model.foo = {}; // 1
    model.foo.bar = {}; // 2
    tracker.undo(); // 3
    assert.equal(dep.getLatestChangeGeneration(), 3);
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

    assert.equal(d1.trackedProperties.size, 2);
    assert.equal(d2.trackedProperties.size, 1);
});

test.run();