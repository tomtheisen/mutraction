import { ForEach, Swapper, defaultTracker, track } from "mutraction-dom";
import { TestScenario, TestScenarioFactory } from "./types.js";

import ifElseFactory from "./scenarios/choose.js";
import transactionFactory from "./scenarios/transaction.js";
import forEachFactory from "./scenarios/foreach.js";

defaultTracker.setOptions({ 
    autoTransactionalize: false, // need explicit tranaction control for tests
});

const model = track({
    activeFactory: undefined as undefined | TestScenarioFactory,
    activeScenario: undefined as undefined | TestScenario,
    stepsComplete: 0,
    scenariosComplete: 0,
    failures: [] as { name: string, messages: string[] }[],
    scenarioFactories: [
        ifElseFactory, 
        transactionFactory,
        forEachFactory,
        // swapperFactory
        // promiseLoaderFactory
        // syncEventFactory
        // localStyleFactory
    ],
});

function getActiveSetter(factory: TestScenarioFactory) {
    return function setActive() {
        model.activeFactory = factory;
        model.activeScenario = factory.create();
    }
}

document.body.append(
    <h1>µ Integrated Tests</h1>,
    <button onclick={ runAll }>Run All</button>,
    <button onclick={ runActive } disabled={ !model.activeScenario }>Run Active</button>,
    ForEach(model.scenarioFactories, factory => 
        <a href="#" onclick={ getActiveSetter(factory) } style={{ fontWeight: model.activeFactory === factory ? "bold" : "" }}>
            { factory.name }
        </a>
    ),
    <p>
        <strong>Scenarios complete:</strong> { model.scenariosComplete }<br />
        <strong>Test steps complete:</strong> { model.stepsComplete }<br />
    </p>,
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
    </div>,
    Swapper(() => model.activeScenario?.root ?? <div />),
);


function runActive() {
    if (!model.activeScenario) return;
    if (model.activeScenario.started) {
        model.activeScenario = model.activeFactory!.create();
    }
    const scenario = model.activeScenario;
    let scenarioFailure = false;

    scenario.started = true;
    for (const step of scenario.steps) {
        step.action();

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

function runAll() {
    model.scenariosComplete = model.stepsComplete = 0;
    model.failures.length = 0;
    for (const factory of model.scenarioFactories) {
        model.activeFactory = factory;
        model.activeScenario = factory.create();
        runActive();
    }

    model.activeFactory = undefined;
    model.activeScenario = undefined;
}
