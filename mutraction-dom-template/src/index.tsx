import { track } from "mutraction-dom";

const model = track({ clicks: 0 });

function increment() {
    ++model.clicks;
}

const app = (
    <>
        <h1>Mutraction</h1>
        <p>Clicks: { model.clicks }</p>
        <button onclick={ increment }>+1</button>
    </>
)

document.body.append(app);
