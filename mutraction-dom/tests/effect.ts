import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { track, effect } from '../src/index.js';

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

test('inner effect runs without outer', () => {
    const [model, tracker] = track({a:0, b:0, c:0});

    let times1 = 0, times2 = 0;

    effect(tracker, () => {
        model.a;
        effect(tracker, () => {
            model.b;
            ++times2;
        });
        model.c;
        ++times1;
    });

    assert.equal(times1, 1);
    assert.equal(times2, 1);

    model.b++;
    assert.equal(times1, 1);
    assert.equal(times2, 2);
});

test('inner conditional effect', () => {
    const [model, tracker] = track({a: false, b: false});

    let t1 = 0, t2 = 0, t3 = 0, t4 = 0;

    effect(tracker, () => {
        ++t1;
        if (model.a) {
            ++t2;
            effect(tracker, () => {
                ++t3;
                if (model.b) {
                    ++t4;
                }
            });
        }
    });
    assert.equal([t1,t2,t3,t4], [1, 0, 0, 0]);

    model.a = true;
    assert.equal([t1,t2,t3,t4], [2, 1, 1, 0]);

    model.b = true;
    assert.equal([t1,t2,t3,t4], [2, 1, 2, 1]);
});

test('dependency suspension', () => {
    const [model, tracker] = track({ a: 1, b: 2, c: 3 });

    let runs = 0;
    effect(tracker, dep => {
        model.a;
        dep.active = false;
        model.b;
        dep.active = true;
        model.c;
        ++runs;
    });
    assert.equal(runs, 1);

    model.a = 111;
    assert.equal(runs, 2);

    model.b = 222;
    assert.equal(runs, 2);

    model.a = 333;
    assert.equal(runs, 3);
});

test.run();
