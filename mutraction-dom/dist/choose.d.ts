type ConditionalElement = {
    nodeGetter: () => CharacterData;
    conditionGetter?: () => boolean;
};
export declare function choose(...choices: ConditionalElement[]): Node;
export {};
