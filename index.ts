import { track, isTracked, getTracker } from './src/mutraction';

let [model, tracker] = track({foo: "bar", area: { inner: 3 }} as any, m => console.log("mutation", m));

console.log(isTracked(model.area));
console.log(getTracker(model.area));
console.log(getTracker({1:2}));

//console.log(tracker.history);

model.zz = 123;
model.area.inner++;

//console.log(tracker.history);

tracker.undo();

model.arr = [1,2];
model.arr.push(6);
model.arr.push(7);

tracker.undo();
tracker.undo();

console.log({model});
