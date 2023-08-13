import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { track, effect } from '../index.js';

test('effect is selective', () => {
    const [model, tracker] = track({x:1,y:2,z:3});
    const effectLog: string[] = [];

    effect(tracker, () => { effectLog.push(`${model.x},${model.y}`); });
    
    model.x += 10;
    model.y += 10;
    model.z += 10;

    assert.equal(effectLog, ["1,2","11,2","11,12"]);
});

test('dependencies update after effect runs', () => {
    const [model, tracker] = track({cond1: false, cond2: false});
    let target = false;

    effect(tracker, () => {
        if (model.cond1) if (model.cond2) target = true;
    });

    model.cond1 = true;
    assert.not.ok(target);

    model.cond2 = true;
    assert.ok(target);
});

test('effect dispose', () => {
    const [model, tracker] = track({a:999} as any);

    let runs = 0;
    const fx = effect(tracker, () => { (model.a, ++runs) });
    assert.equal(runs, 1);

    model.a++;
    assert.equal(runs, 2);

    model.a++;
    assert.equal(runs, 3);

    fx.dispose();
    model.a++;
    assert.equal(runs, 3);
});

test('effect exit', () => {
    const [model, tracker] = track({p: 44});
    const effectLog: string[] = [];

    effect(tracker, () => {
        const p = model.p;
        effectLog.push("in:" + p);
        return () => { effectLog.push("out:" + p); };
    });

    model.p = 55;
    model.p = 66;

    assert.equal(effectLog, ["in:44","out:44","in:55","out:55","in:66"]);
});

test.run();