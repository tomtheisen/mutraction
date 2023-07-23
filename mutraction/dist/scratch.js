import { track } from "./src/proxy";
const [model, tracker] = track({ foo: "bar", inner: { leaf1: 4, leaf2: 45 } });
let dt = tracker.startDependencyTrack();
let inner = model.inner;
tracker.endDependencyTrack(dt);
console.log(tracker.generation, dt.getLatestChangeGeneration());
// console.log(dt);
model.asdf = 234;
console.log(tracker.generation, dt.getLatestChangeGeneration());
