import React, { JSX, useCallback } from "react"
import { useTrackerContext } from "./TrackerContext.js";

type BoundInputProps = {
    bindValue: () => string,
} & Omit<JSX.IntrinsicElements["input"], "value" | "onInput">

export function BoundInput({ bindValue, ...props }: BoundInputProps) {
    const tracker = useTrackerContext();
    const ref = tracker.getPropRef(bindValue);
    const change = useCallback(
        (ev: React.FormEvent<HTMLInputElement>) => ref.current = ev.currentTarget.value, 
        [ref]);
    
    // todo: use refs and native events
    return <input { ...props } value={ ref.current } onInput={ change } />;
}