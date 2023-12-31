import { Swapper, neverTrack, track, cleanup } from "mutraction-dom";
import type { TestScenario, TestScenarioFactory } from "../types.js";

function create(): TestScenario {
    const model = track({
        current: { value: 123 }
    });

    const root = neverTrack(
        <div>
            <h3>Swaps</h3>
            { Swapper(() => {
                const { current } = model;
                return <p>
                    <strong>Value: </strong>
                    <span id="value">{ current.value }</span>
                </p>
            }) }
        </div> as HTMLDivElement);

    const originalP = root.querySelector("p");
    const originalRef = model.current;

    const steps = [
        { 
            action() { model.current.value = 234 },
            assertions: [
                { 
                    condition: () => root.querySelector("#value")?.innerHTML === "234",
                    message: "#value should be '234'",
                },
                {
                    condition: () => root.querySelector("p") === originalP,
                    message: "p element should be reference identical",
                },
            ]
        },
        {
            action() { model.current = { value: 234 } },
            assertions: [
                { 
                    condition: () => root.querySelector("#value")?.innerHTML === "234",
                    message: "#value should be '234'",
                },
                {
                    condition: () => root.querySelector("p") !== originalP,
                    message: "p element should be replaced",
                },
            ]
        },
        {
            action() {
                cleanup.doScheduledCleanupsNow();
                originalRef.value = 999;
            },
            assertions: [
                { 
                    condition: () => originalP?.querySelector("#value")?.innerHTML === "234",
                    message: "Detached swapper element should have update effects disposed and not be updated.",
                },
                { 
                    condition: () => root.querySelector("#value")?.innerHTML === "234",
                    message: "#value should be '234', not changed old swapper subject mutations",
                },
            ]
        },
    ];

    return { root, steps };
}

const scenario: TestScenarioFactory = {
    name: "Swapper",
    create,
}

export default scenario;