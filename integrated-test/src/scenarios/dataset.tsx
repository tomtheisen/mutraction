import { neverTrack, track, ForEach } from "mutraction-dom";
import type { TestScenario, TestScenarioFactory } from "../types.js";

function create(): TestScenario {
    const model = track({
      emoticons: [
        { icon: ":-)", search: "smile" },
      ] 
    })

    const root = neverTrack(
        <div>
            <h3>static dataset</h3>
            <div data-char="A" data-type="alpha">A</div>
            <h3>dynamic dataset</h3>
            <ul>
              { ForEach(model.emoticons, item => 
                <li data-search={item.search}>{item.icon}</li>
              ) }
            </ul>
        </div> as HTMLDivElement);

    const steps = [
        {
            action() {  },
            assertions: [
                {
                    condition: () => (root.querySelector('[data-char="A"]') as HTMLElement)?.dataset.type === "alpha",
                    message: '([data-char="A"]).dataset.type is "alpha" (static dataset query & accessor)',
                },
                {
                    condition: () => (root.querySelector('[data-search="smile"]') as HTMLElement).innerText === ":-)",
                    message: 'search "smile" turns up ":-)" (dynamic dataset query)',
                },
            ],
        },
        {
            action() { model.emoticons.push({ icon: ":-O", search: "wow" }) },
            assertions: [
                {
                    condition: () => (root.querySelector('[data-search="wow"]') as HTMLElement).innerText === ":-O",
                    message: 'search "wow" turns up ":-O" after push (dynamic dataset query)',
                },
            ],
        },
    ];

    return { root, steps };
}

const scenario: TestScenarioFactory = {
    name: "Dataset Attributes",
    create,
}

export default scenario;
