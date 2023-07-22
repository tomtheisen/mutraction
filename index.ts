import { track, isTracked, getTracker } from './src/mutraction';

let [model, tracker] = track([1] as any, m => console.log("mutation", m));

model[0] = 4;
model[2] = 3;

console.log({model});

tracker.undo();

console.log({model});

tracker.redo();

console.log({model});
    