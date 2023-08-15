/// <reference types="react" />
export declare function ForEach<T extends readonly any[], U extends Node>(props: {
    each: T | undefined | null | false;
    fallback?: JSX.Element;
    children: (item: T[number], index: number) => U;
}): Node;
