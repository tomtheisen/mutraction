import { track } from "mutraction-dom";

export const model = track({ clicks: 0 });

export function increment() {
    ++model.clicks;
}
