export const defaultSource = `import { track } from "mutraction-dom";

const model = track({ clicks: 0 });

const clicker = (
<button onclick={ () => ++model.clicks }>
    Clicks: { model.clicks }
</button>
);

document.body.append(clicker);`;

