import { JSX } from "react";
type BoundInputProps = {
    bindValue: () => string;
} & Omit<JSX.IntrinsicElements["input"], "value" | "onInput">;
export declare function BoundInput({ bindValue, ...props }: BoundInputProps): JSX.Element;
type BoundCheckboxProps = {
    bindChecked: () => boolean;
} & Omit<JSX.IntrinsicElements["input"], "value" | "onChange" | "type">;
export declare function BoundCheckbox({ bindChecked, ...props }: BoundCheckboxProps): JSX.Element;
export {};
