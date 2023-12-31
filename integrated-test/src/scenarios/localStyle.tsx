import { neverTrack, makeLocalStyle } from "mutraction-dom";
import type { TestScenario, TestScenarioFactory } from "../types.js";

function create(): TestScenario {
    const style = makeLocalStyle({
        "p": {
            fontStyle: "italic",
        }
    });

    const root = neverTrack(
        <div>
            <p id="p1">unstyled</p>
            <p id="p2" mu:apply={ style }>orange</p>
        </div> as HTMLDivElement);

    const steps = [
        { 
            action() {  },
            assertions: [
                { 
                    condition: () => getComputedStyle(root.querySelector("#p1")!).fontStyle === "normal",
                    message: "#p1 font style should be normal",
                },
                { 
                    condition: () => getComputedStyle(root.querySelector("#p2")!).fontStyle === "italic",
                    message: "#p2 font style should be italic",
                },
            ]
        },
    ];

    return { root, steps };
}

const scenario: TestScenarioFactory = {
    name: "Local Style",
    create,
}

export default scenario;