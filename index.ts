import { track } from './src/mutraction';

let [model, tracker] = track({foo: "bar", area: { inner: 3 }} as any);

console.log(tracker.history);

model.zz = 123;
model.area.inner++;

console.log(tracker.history);

tracker.undo();
console.log(model);
