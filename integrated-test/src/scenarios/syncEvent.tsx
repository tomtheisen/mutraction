import { neverTrack, track } from "mutraction-dom";
import type { TestScenario, TestScenarioFactory } from "../types.js";

function create(): TestScenario {
    const model = track({
        value: "abc"
    });

    const root = neverTrack(
        <div>
            <h3>a / b / c</h3>
            <input value={ model.value } mu:syncEvent="focus" />
        </div> as HTMLDivElement);

    const steps = [
        { 
            action() { },
            assertions: [
                { 
                    condition: () => root.querySelector("input")?.value === "abc",
                    message: "input value should be 'abc'",
                },
            ]
        },
        { 
            action() { model.value = "efg" },
            assertions: [
                { 
                    condition: () => root.querySelector("input")?.value === "efg",
                    message: "input value should be 'efg'",
                },
            ]
        },
        {
            action() { 
                const input = root.querySelector("input")!;
                input.value = "hij";
                input.focus();
            },
            assertions: [
                { 
                    condition: () => model.value === "hij",
                    message: "Focus event should have updated model value to 'hij'",
                },
            ]
        },
    ];

    return { root, steps };
}

const scenario: TestScenarioFactory = {
    name: "SyncEvent",
    create,
}

export default scenario;