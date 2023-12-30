import { neverTrack, track } from "mutraction-dom";
import type { TestScenario, TestScenarioFactory } from "../types.js";

function create(): TestScenario {
    const model = track({
        a: true,
        b: true,
    });

    const root = neverTrack(
        <div>
            <h3>a / b / c</h3>
            <div id="a" mu:if={ model.a }>a</div>
            <div id="b" mu:else mu:if={ model.b }>b</div>
            <div id="c" mu:else>c</div>
        </div> as HTMLDivElement);

    const steps = [
        { 
            action() { },
            assertions: [
                { 
                    condition: () => !!root.querySelector("#a"),
                    message: "#a wasn't present (mu:if)",
                },
                {
                    condition: () => !root.querySelector("#b"),
                    message: "#b was present (mu:else mu:if)",
                },
                {
                    condition: () => !root.querySelector("#c"),
                    message: "#c was present (mu:else)",
                },
            ]
        },
        {
            action() {
                model.a = false;
            },
            assertions: [
                { 
                    condition: () => !root.querySelector("#a"),
                    message: "#a was present (mu:if)",
                },
                {
                    condition: () => !!root.querySelector("#b"),
                    message: "#b wasn't present (mu:else mu:if)",
                },
            ]
        },
        {
            action() {
                model.b = false;
            },
            assertions: [
                { 
                    condition: () => !root.querySelector("#b"),
                    message: "#b was present (mu:else mu:if)",
                },
                {
                    condition: () => !!root.querySelector("#c"),
                    message: "#c wasn't present (mu:else)",
                },
            ]
        },
    ];

    return { root, steps };
}

const scenario: TestScenarioFactory = {
    name: "If / Else",
    create,
}

export default scenario;