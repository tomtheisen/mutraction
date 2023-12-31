export type Assertion = {
    condition: (root: ParentNode) => boolean;
    message: string;
};

export type TestScenario = {
    root: ParentNode;
    steps: {
        action: () => void | Promise<void>; // model mutation
        assertions: Assertion[];
    }[];
    started?: true;
}

export type TestScenarioFactory = {
    name: string;
    create(): TestScenario;
};
