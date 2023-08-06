import React, { JSX, useCallback } from "react"
import { useTrackerContext } from "./TrackerContext.js";

type BoundInputProps = {
    bindValue: () => string,
} & Omit<JSX.IntrinsicElements["input"], "value" | "onInput">

export function BoundInput({ bindValue, ...props }: BoundInputProps) {
    const tracker = useTrackerContext();
    const ref = tracker.getPropRef(bindValue);
    const change = useCallback(function change(ev: React.FormEvent<HTMLInputElement>) {
        console.log("BoundInput change", { ref, ev });
        const value = ev.currentTarget.value;
        ref.current = value;
    }, [ref]);
    return <input { ...props } 
        value={ ref.current } 
        onInput={ change } />;
}