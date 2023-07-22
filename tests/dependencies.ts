import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { track, untrack, isTracked } from '../';

test('track inner dep', () => {
    const [model, tracker] = track({ foo: "bar", inner: { leaf1: 4, leaf2: 45 } } as any);

    let dt1 = tracker.startDependencyTrack();
    model.foo;
    assert.equal(dt1, new Set([model]));

    tracker.startDependencyTrack();
    model.inner.leaf1;
    model.inner.leaf2;
    let dt2 = tracker.endDependencyTrack();
    assert.equal(dt2, new Set([model, model.inner]));

    tracker.endDependencyTrack();

    assert.throws(() => tracker.endDependencyTrack());
});

test.run();