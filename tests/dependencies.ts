import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { track, untrack, isTracked } from '../index';

test('track inner dep', () => {
    const [model, tracker] = track({ foo: "bar", inner: { leaf1: 4, leaf2: 45 } } as any);

    let dt1 = tracker.startDependencyTrack();
    model.foo;
    assert.equal(dt1.trackedObjects, new Set([model]));

    let dt2 = tracker.startDependencyTrack();
    model.inner.leaf1;
    model.inner.leaf2;
    tracker.endDependencyTrack(dt2);
    assert.equal(dt2.trackedObjects, new Set([model, model.inner]));

    tracker.endDependencyTrack(dt1);

    assert.throws(() => tracker.endDependencyTrack(dt1));
});

test('inner change does not increase outer dependency generation', () => {
    const [model, tracker] = track({ foo: { leaf1: 4, leaf2: 45 }, inner: "bar" } as any);

    let dt1 = tracker.startDependencyTrack();
    let foo = model.foo;
    tracker.endDependencyTrack(dt1);
    assert.equal(dt1.trackedObjects, new Set([model]), "tracker 1 contents");
    assert.ok(isTracked(foo), "inner object is tracked");

    let dt2 = tracker.startDependencyTrack();
    foo.leaf1;
    tracker.endDependencyTrack(dt2);
    assert.equal(dt2.trackedObjects, new Set([foo]), "tracker 2 contents");

    const g1_1 = dt1.getLatestChangeGeneration();
    const g2_1 = dt2.getLatestChangeGeneration();

    model.cram = "berries";

    const g1_2 = dt1.getLatestChangeGeneration();
    const g2_2 = dt2.getLatestChangeGeneration();

    assert.ok(g1_1 < g1_2, "first tracker generation changed");
    assert.ok(g2_1 === g2_2, "second tracker generation did not change");

    foo.brindel = "squizzblaster";

    const g1_3 = dt1.getLatestChangeGeneration();
    const g2_3 = dt2.getLatestChangeGeneration();

    assert.ok(g1_2 === g1_3, "first tracker generation did not change");
    assert.ok(g2_2 < g2_3, "second tracker generation changed");
});

test.run();