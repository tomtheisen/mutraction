import { ForEachPersist, neverTrack, track, cleanup, defaultTracker } from "mutraction-dom";
import { TestScenario } from "../types.js";

class ItemObject {
    id: string;
    constructor(id: string) {
        this.id = id;
    }
}

function create(): TestScenario {
    const model = track([new ItemObject("abc")]);
    let abc: ItemObject | undefined = model[0], abcDisposed = false;

    const root: ParentNode = neverTrack(<div>
        { ForEachPersist(model,  e => <p id={ e.id }>{ e.id }</p>) }
    </div> as HTMLDivElement);

    const abcEl = root.querySelector("#abc")!;

    const steps = [
        {
            action() {
                cleanup.registerCleanupForNode(abcEl, { 
                    dispose() { 
                        abcDisposed = true;
                        console.log("abc cleaning up");
                    } 
                })
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
                model[0] = new ItemObject("def");
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
                // abc = undefined;
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
        {
            action() {
                abc = undefined; // abc now eligible for gc -> abcEl now eligible for cleanup
                defaultTracker.clearHistory();
            },
            assertions: [
                {
                    condition: () => abcDisposed,
                    message: "abc should have been GC'd, and the element should be cleaned up",
                }
            ]
        }
        
    ];

    return {
        root, steps
    };
}

export default {
    name: "ForEachPersist",
    create
};
