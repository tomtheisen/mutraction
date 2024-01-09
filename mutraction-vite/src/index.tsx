import { increment, model } from "./model.js";

const app =
    <>
        <img src="resources/logo.png" alt="mutraction logo" style={{ margin: "3em auto" }} />
        <h1>Mutraction</h1>
        <p>Clicks: { model.clicks }</p>
        <button onclick={ increment }>+1</button>
        <footer>
            <a href="https://mutraction.dev/">Learn more</a>
        </footer>
    </>;
    
document.body.append(app);
