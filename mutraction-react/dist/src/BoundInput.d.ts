import { JSX } from "react";
type BoundInputProps = {
    bindValue: () => string;
} & Omit<JSX.IntrinsicElements["input"], "value" | "onInput">;
export declare function BoundInput({ bindValue, ...props }: BoundInputProps): JSX.Element;
export {};
