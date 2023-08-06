import React, { JSX } from "react"
import { useTrackerContext } from "./TrackerContext";

type BoundInputProps = {
    bindValue: () => string,
} & Omit<JSX.IntrinsicElements["input"], "value" | "onInput">

export function BoundInput({ bindValue, ...props }: BoundInputProps) {
    const tracker = useTrackerContext();
    const ref = tracker.getPropRef(bindValue);
    return <input { ...props } 
        value={ ref.current } 
        onInput={ ev => ref.current=ev.currentTarget.value } />;
}