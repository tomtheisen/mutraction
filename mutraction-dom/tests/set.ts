import { track, defaultTracker as tracker, effect, Tracker, isTracked, defaultTracker } from '../src/index.js';
import { test } from 'uvu';
import * as assert from 'uvu/assert';

test('set size effect', () => {
    const model = track(new Set<number>);
    const lengths: number[] = [];

    effect(() => { lengths.push(model.size); });

    assert.equal(lengths, [0]);

    model.add(33);
    assert.equal(lengths, [0, 1]);

    model.add(44);
    assert.equal(lengths, [0, 1, 2]);

    model.add(33);
    assert.equal(lengths, [0, 1, 2]);

    model.delete(33);
    assert.equal(lengths, [0, 1, 2, 1]);
});

test('set membership effect', () => {
    const model = track(new Set<number>);

    let has = false;

    effect(() => { has = model.has(123) });

    model.add(123);
    model.add(234);
    assert.ok(has);

    model.delete(123);
    assert.equal(model, new Set([234]));
    assert.not.ok(has);
});

test('set clear undo', () => {
    const model = track(new Set<number>([66, 77]));

    model.clear();
    assert.equal(model, new Set<number>);

    defaultTracker.undo();
    assert.equal(model, new Set<number>([66, 77]));
});

test('set member track', () => {
    const model = track(new Set([{ current: "original" }]));

    const [member] = [...model.values()];

    assert.equal(member, {current: "original"});

    member.current = "changed"
    assert.equal(member, {current: "changed"});

    defaultTracker.undo();
    assert.equal(member, {current: "original"});

    assert.ok(model.has(member));
});

test('set addition track', () => {
    const model = track({
        vals: new Set<{ current: string }>,
        val: "",
    });
    model.vals.add({ current: "original" });

    const [member] = [...model.vals.values()];

    assert.equal(member, {current: "original"});

    member.current = "changed"
    assert.equal(member, {current: "changed"});

    defaultTracker.undo();
    assert.equal(member, {current: "original"});

    assert.ok(model.vals.has(member));
});

test.run();
