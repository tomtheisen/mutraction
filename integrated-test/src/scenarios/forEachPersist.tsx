import { ForEachPersist, neverTrack, track, cleanup } from "mutraction-dom";
import { TestScenario } from "../types.js";

function create(): TestScenario {
    const model = track([{ id: "abc" }]);
    let abc: { id: string } | undefined = model[0], abcDisposed = false;

    const root: ParentNode = neverTrack(<div>
        { ForEachPersist(model,  e => <p id={ e.id }>{ e.id }</p>) }
    </div> as HTMLDivElement);

    const abcEl = root.querySelector("#abc")!;

    const steps = [
        {
            action() {
                cleanup.registerCleanupForNode(abcEl, { dispose() { abcDisposed = true; } })
            },
            assertions: [
                {
                    condition: () => abcEl != null,
                    message: "abc should be present",
                },
            ]
        },
        {
            action() {
                model[0] = { id: "def" }
            },
            assertions: [
                {
                    condition: () => !abcEl.isConnected,
                    message: "abc should no longer be connected",
                },
                {
                    condition: () => root.querySelector("p")?.innerText === "def",
                    message: "contents should now be def",
                },
            ]
        },
        {
            action() {
                model[0] = abc!;
            },
            assertions: [
                {
                    condition: () => abcEl.isConnected,
                    message: "abc should be reconnected",
                }
            ]
        },
        {
            action() {
                model.length = 0;
                abc = undefined;
            },
            assertions: [
                {
                    condition: () => !abcEl!.isConnected,
                    message: "abc should be re-disconnected",
                },
                {
                    condition: () => !abcDisposed,
                    message: "abc should not be disposed",
                },
            ]
        },
        {
            action() {
                cleanup.doScheduledCleanupsNow();
            },
            assertions: [
                {
                    condition: () => !abcDisposed,
                    message: "abc should not be disposed ... yet",
                }
            ]
        },
        
    ];

    return {
        root, steps
    };
}

export default {
    name: "ForEachPersist",
    create
};
