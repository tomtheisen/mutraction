import { increment, model } from "./model.js";

const app =
    <>
        <h1>Mutraction</h1>
        <p>Clicks: { model.clicks }</p>
        <button onclick={ increment }>+1</button>
    </>;
    
document.body.append(app);
