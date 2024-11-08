import { neverTrack } from "mutraction-dom";
import { TestScenario, TestScenarioFactory, Assertion } from "../types.js";
import "mutraction-dom";

function create(): TestScenario {
    let p1: HTMLParagraphElement, p2: HTMLParagraphElement;

    const root = neverTrack(
        <div>
            <p mu:ref={el => p1 = el}>&nbsp; &nbsp;</p>
            <p mu:ref={el => p2 = el}>
                &nbsp; &nbsp;
            </p>
        </div> as HTMLDivElement);
    
    const steps = [
        {
            action() { },
            assertions: [
                {
                    condition: () => p1.innerText === "\xa0 \xa0",
                    message: "p1 didn't contain the expected whitespace",
                },
                {
                    condition: () => p2.innerText === "\xa0 \xa0",
                    message: "p2 didn't contain the expected whitespace",
                },
            ] satisfies Assertion[]
        }
    ];

    return { root, steps };
}

const scenario: TestScenarioFactory = {
    name: "JSX",
    create,
};

export default scenario;
