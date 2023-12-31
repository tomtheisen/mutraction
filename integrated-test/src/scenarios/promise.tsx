import { neverTrack, track, cleanup, PromiseLoader } from "mutraction-dom";
import type { TestScenario, TestScenarioFactory } from "../types.js";

function getPromiseBundle() {
    let resolve: ((result: Node) => void) | undefined;
    let fail: ((reason: any) => void) | undefined;
    const promise = new Promise<Node>((result, reject) => {
        resolve = result;
        fail = reject;
    });
    if (!resolve || !fail) throw "didn't get callbacks";
    return { promise, resolve, fail };
}

function create(): TestScenario {
    const p1 = getPromiseBundle();
    const p2 = getPromiseBundle();

    const root = neverTrack(
        <div>
            <h3>PromiseLoader</h3>
            <div id="p1">
                { PromiseLoader(p1.promise, <div class="spinner">spinner</div>, reason => <div class="error">{ reason }</div>) }
            </div>
            <div id="p2">
                { PromiseLoader(p2.promise, <div class="spinner">spinner</div>, reason => <div class="error">{ reason }</div>) }
            </div>
        </div> as HTMLDivElement);

    const steps = [
        { 
            action() { },
            assertions: [
                { 
                    condition: () => root.querySelectorAll(".spinner").length === 2,
                    message: "spinners should be attached",
                },
            ]
        },
        {
            async action() { p1.fail("fubar"); },
            assertions: [
                { 
                    condition: () => root.querySelector("#p1 .error")?.innerHTML === "fubar",
                    message: ".error should contain fubar",
                },
            ]
        },
        {
            async action() { p2.resolve(<span class="success">yay</span>); },
            assertions: [
                { 
                    condition: () => root.querySelector("#p2 .success")?.innerHTML === "yay",
                    message: "success: yay should be resolved",
                },
            ]
        },
        {
            async action() {
                p2.fail("");
            },
            assertions: [
                { 
                    condition: () => root.querySelector("#p2 .success")?.innerHTML === "yay",
                    message: "success: yay should still be resolved",
                },
                { 
                    condition: () => !root.querySelector("#p2 .error"),
                    message: "shouldn't be able to fail a resolved promise",
                },
            ]
        },
    ];

    return { root, steps };
}

const scenario: TestScenarioFactory = {
    name: "PromiseLoader",
    create,
}

export default scenario;
