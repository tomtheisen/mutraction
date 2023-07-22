import { track, isTracked, getTracker } from './src/mutraction';

const log = (m: unknown) => console.log("mutation", m)

const [model, tracker] = track(['a','b','c'] as any, log);

model.length = 0;

console.log({model, history: tracker.history});

tracker.rollback();

console.log({model, history: tracker.history});