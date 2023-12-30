import { neverTrack, track, defaultTracker, untrackedClone } from "mutraction-dom";
import type { TestScenario, TestScenarioFactory } from "../types.js";

function create(): TestScenario {
    const model = track({
        count: 0
    });

    const root = neverTrack(
        <div>
            <h3>Transacting</h3>
            Count: <span id="count">{ model.count }</span>
        </div> as HTMLDivElement);

    const steps = [
        { 
            action() { ++model.count; },
            assertions: [
                { 
                    condition: () => root.querySelector("#count")?.innerHTML === "1",
                    message: "Count should be 1",
                },
            ]
        },
        {
            action() { 
                defaultTracker.startTransaction();
                ++model.count;
            },
            assertions: [
                { 
                    condition: () => root.querySelector("#count")?.innerHTML === "1",
                    message: "Count should be 1 with open transaction",
                },
            ]
        },
        {
            action() { defaultTracker.commit(); },
            assertions: [
                { 
                    condition: () => root.querySelector("#count")?.innerHTML === "2",
                    message: "Count should be 2 after committing",
                },
            ]
        },
        {
            action() {
                ++model.count;
                ++model.count;
                defaultTracker.undo();
            },
            assertions: [
                { 
                    condition: () => root.querySelector("#count")?.innerHTML === "3",
                    message: "Count should be 3 after undoing",
                },
                { 
                    condition: () => model.count === 3,
                    message: "Model count should be 3 after undoing",
                },
            ]
        },
    ];

    return { root, steps };
}

const scenario: TestScenarioFactory = {
    name: "Transaction",
    create,
}

export default scenario;