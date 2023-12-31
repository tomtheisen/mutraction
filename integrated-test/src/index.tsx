import { ForEach, Swapper, defaultTracker, track } from "mutraction-dom";
import { TestScenario, TestScenarioFactory } from "./types.js";

import ifElseFactory from "./scenarios/choose.js";
import transactionFactory from "./scenarios/transaction.js";
import forEachFactory from "./scenarios/foreach.js";
import swapperFactory from "./scenarios/swapper.js";
import promiseLoaderFactory from "./scenarios/promise.js";
import makeLocalStyleFactory from "./scenarios/localStyle.js";
import syncEventFactory from "./scenarios/syncEvent.js";

defaultTracker.setOptions({ 
    autoTransactionalize: false, // need explicit tranaction control for tests
});

const model = track({
    activeFactory: undefined as undefined | TestScenarioFactory,
    activeScenario: undefined as undefined | TestScenario,
    runAllComplete: false,
    stepsComplete: 0,
    scenariosComplete: 0,
    failures: [] as { name: string, messages: string[] }[],
    scenarioFactories: [
        ifElseFactory, 
        transactionFactory,
        forEachFactory,
        swapperFactory,
        promiseLoaderFactory,
        makeLocalStyleFactory,
        syncEventFactory,
    ],
});

async function runActive() {
    if (!model.activeScenario) return;
    if (model.activeScenario.started) {
        model.activeScenario = model.activeFactory!.create();
    }
    const scenario = model.activeScenario;
    let scenarioFailure = false;

    scenario.started = true;
    for (const step of scenario.steps) {
        const resolution = step.action();
        if (resolution) await resolution;

        for (const assertion of step.assertions) {
            const success = assertion.condition(scenario.root);
            if (!success) {
                if (!scenarioFailure) model.failures.push({ name: model.activeFactory!.name, messages: [] });
                scenarioFailure = true;
                model.failures.at(-1)!.messages.push(assertion.message);
            }
        }
        model.stepsComplete++;
    }

    model.scenariosComplete++;
}

async function runAll() {
    model.scenariosComplete = model.stepsComplete = 0;
    model.failures.length = 0;
    for (const factory of model.scenarioFactories) {
        model.activeFactory = factory;
        model.activeScenario = factory.create();
        await runActive();
    }

    model.activeFactory = undefined;
    model.activeScenario = undefined;
    model.runAllComplete = true;
}

const app = <>
    <h1>µ Integrated Tests</h1>
    <button onclick={ runAll }>Run All</button>
    <button onclick={ runActive } disabled={ !model.activeScenario }>Run Active</button>
    { ForEach(model.scenarioFactories, factory => 
        <a href="#" onclick={ () => model.activeScenario = (model.activeFactory = factory).create() } style={{ fontWeight: model.activeFactory === factory ? "bold" : "" }}>
            { factory.name }
        </a>
    ) }
    <p>
        <strong>Scenarios complete:</strong> { model.scenariosComplete }<br />
        <strong>Test steps complete:</strong> { model.stepsComplete }<br />
    </p>
    <div mu:if={ model.failures.length > 0 }>
        <h2>Failures</h2>
        <ul>
            { ForEach(model.failures, scenario =>
                <li>
                    <strong>{ scenario.name }</strong>
                    <ul>
                        { ForEach(scenario.messages, msg => <li>{ msg }</li>) }
                    </ul>
                </li>
            ) }
        </ul>
    </div>
    <div mu:else mu:if={ model.runAllComplete }>
        ✅ All tests passed.
    </div>
    { Swapper(() => model.activeScenario?.root ?? <div />) }
</>;

document.body.append(app);

