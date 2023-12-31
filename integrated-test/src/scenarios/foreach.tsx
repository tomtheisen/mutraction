import { neverTrack, track, ForEach } from "mutraction-dom";
import type { TestScenario, TestScenarioFactory } from "../types.js";

function create(): TestScenario {
    const model = track({
        items: [{ id: 1, name: "a" }],
    });

    const root = neverTrack(
        <div>
            <h3>Items</h3>
            <ul>
                { ForEach(model.items, item => 
                    <li>
                        <span class="id">{ item.id }</span>
                        <span class="name">{ item.name }</span>
                    </li>
                ) }
            </ul>
        </div> as HTMLDivElement);

    let lis: HTMLElement[] = [];

    const steps = [
        { 
            action() { model.items.push({ id: 2, name: "b" }) },
            assertions: [
                { 
                    condition: () => root.querySelectorAll(".id")[0]?.innerHTML === "1",
                    message: "First id should be 1",
                },
                { 
                    condition: () => root.querySelectorAll(".id")[1]?.innerHTML === "2",
                    message: "Second id should be 2",
                },
            ]
        },
        {
            action() { model.items[1].name += " !!!" },
            assertions: [
                {
                    condition: () => root.querySelectorAll(".name")[1]?.innerHTML === "b !!!",
                    message: "Second name should be modified (b !!!)",
                }
            ]
        },
        { 
            action() { model.items.length = 0 },
            assertions: [
                { 
                    condition: () => root.querySelectorAll("li").length === 0,
                    message: "All list items should be removed",
                },
            ]
        },
        {
            action() { model.items.push({ id: 33, name: "wert" }, { id: 44, name: "erty" }) },
            assertions: [
                {
                    condition() {
                        const lis = Array.from(root.querySelectorAll("li"));
                        return lis.length === 2;
                    },
                    message: "There should be 2 <li>s.",
                },
            ]
        },
        {
            action() { model.items.reverse(); },
            assertions: [
                {
                    condition: () => Array.from(root.querySelectorAll("li")).every(li => !lis.includes(li)),
                    message: "Reversing array should make all new elements",
                }
            ]
        },
    ];

    return { root, steps };
}

const scenario: TestScenarioFactory = {
    name: "ForEach",
    create,
}

export default scenario;