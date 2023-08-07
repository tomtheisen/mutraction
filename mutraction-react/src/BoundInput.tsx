import React, { JSX, useCallback, useEffect, useRef } from "react"
import { useTrackerContext } from "./TrackerContext.js";

type BoundInputProps = 
    { bindValue: () => string }
    & Omit<JSX.IntrinsicElements["input"], "value" | "onInput">;

export function BoundInput({ bindValue, ...props }: BoundInputProps) {
    const tracker = useTrackerContext();
    const ref = tracker.getPropRef(bindValue);
    const change = useCallback(
        (ev: React.FormEvent<HTMLInputElement>) => ref.current = ev.currentTarget.value, 
        [ref]);
    
    return <input { ...props } value={ ref.current } onInput={ change } />;
}

type BoundCheckboxProps = 
    { bindChecked: () => boolean }
    & Omit<JSX.IntrinsicElements["input"], "value" | "onChange" | "type">;

    export function BoundCheckbox({ bindChecked, ...props }: BoundCheckboxProps) {
    const tracker = useTrackerContext();
    const ref = tracker.getPropRef(bindChecked);
    const change = useCallback(
        (ev: React.FormEvent<HTMLInputElement>) => ref.current = ev.currentTarget.checked, 
        [ref]);
    
    return <input type="checkbox" { ...props } checked={ ref.current } onChange={ change } />;
}

type BoundTextareaProps = 
    { bindValue: () => string }
    & Omit<JSX.IntrinsicElements["textarea"], "value" | "onInput">;

export function BoundTextarea({ bindValue, ...props }: BoundTextareaProps) {
    const tracker = useTrackerContext();
    const ref = tracker.getPropRef(bindValue);
    const change = useCallback(
        (ev: React.FormEvent<HTMLTextAreaElement>) => ref.current = ev.currentTarget.value, 
        [ref]);
    
    return <textarea { ...props } value={ ref.current } onInput={ change } />;
}

