import { track } from './src/mutraction';

let [model, tracker] = track({foo: "bar"} as any);

console.log(tracker.history);

model.zz = 123;

console.log(tracker.history);

tracker.undo();
console.log(model);
