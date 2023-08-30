import { track, defaultTracker as tracker, effect, defaultTracker, Tracker } from '../src/index.js';
import { test } from 'uvu';
import * as assert from 'uvu/assert';

test('effect is selective', () => {
    const model = track({x:1,y:2,z:3});
    const effectLog: string[] = [];

    effect(() => { effectLog.push(`${model.x},${model.y}`); }, { tracker });
    
    model.x += 10;
    model.y += 10;
    model.z += 10;

    assert.equal(effectLog, ["1,2","11,2","11,12"]);
});

test('dependencies update after effect runs', () => {
    const model = track({cond1: false, cond2: false});
    let target = false;

    effect(() => {
        if (model.cond1) if (model.cond2) target = true;
    }, { tracker });

    model.cond1 = true;
    assert.not.ok(target);

    model.cond2 = true;
    assert.ok(target);
});

test('effect dispose', () => {
    const model = track({a:999} as any);

    let runs = 0;
    const fx = effect(() => { (model.a, ++runs) }, { tracker });
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
    const model = track({p: 44});
    const effectLog: string[] = [];

    effect(() => {
        const p = model.p;
        effectLog.push("in:" + p);
        return () => { effectLog.push("out:" + p); };
    }, { tracker });

    model.p = 55;
    model.p = 66;

    assert.equal(effectLog, ["in:44","out:44","in:55","out:55","in:66"]);
});

test('inner effect runs without outer', () => {
    const model = track({a:0, b:0, c:0});

    let times1 = 0, times2 = 0;

    effect(() => {
        model.a;
        effect(() => {
            model.b;
            ++times2;
        }, { tracker });
        model.c;
        ++times1;
    }, { tracker });

    assert.equal(times1, 1);
    assert.equal(times2, 1);

    model.b++;
    assert.equal(times1, 1);
    assert.equal(times2, 2);
});

test('inner conditional effect', () => {
    const model = track({a: false, b: false});

    let t1 = 0, t2 = 0, t3 = 0, t4 = 0;

    effect(() => {
        ++t1;
        if (model.a) {
            ++t2;
            effect(() => {
                ++t3;
                if (model.b) {
                    ++t4;
                }
            }, { tracker });
        }
    }, { tracker });
    assert.equal([t1,t2,t3,t4], [1, 0, 0, 0]);

    model.a = true;
    assert.equal([t1,t2,t3,t4], [2, 1, 1, 0]);

    model.b = true;
    assert.equal([t1,t2,t3,t4], [2, 1, 2, 1]);
});

test('dependency suspension', () => {
    const model = track({ a: 1, b: 2, c: 3 });

    let runs = 0;
    effect(dep => {
        model.a;
        dep.active = false;
        model.b;
        dep.active = true;
        model.c;
        ++runs;
    }, { tracker });
    assert.equal(runs, 1);

    model.a = 111;
    assert.equal(runs, 2);

    model.b = 222;
    assert.equal(runs, 2);

    model.a = 333;
    assert.equal(runs, 3);
});

test('exotic array effect', () => {
    const model = track([] as string[]);
    const lengths: number[] = [];

    effect(() => {
        lengths.push(model.length);
    });

    model[57] = "asdf";

    assert.equal(lengths, [0, 58]);
});

test('transaction affects history length', () => {
    const tr = new Tracker;
    const model = tr.track({
        prop: 8,
        method() {
            ++this.prop;
        }
    });

    let historyLength = 0;
    let runs = 0;

    effect(() => {
        ++runs;
        historyLength = tr.history.length;
    }, { tracker: tr });

    assert.equal(runs, 1, "initial effect");
    assert.equal(historyLength, 0, "no history");
    
    model.method();

    assert.equal(runs, 2, "next effect");
    assert.equal(historyLength, 1, "had history");
});

test.run();
