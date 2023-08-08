import * as React from "react";

export function ModelVisualizer({ value }: { value: unknown; }) {
    if (Array.isArray(value)) {
        return <ol>{value.map((e, i) => <li key={i}>
            <ModelVisualizer value={e} />
        </li>)}</ol>;
    }
    else if (typeof value === "object" && value) {
        return <ul>{Object.entries(value).map(([key, val]) => <li key={key}>{key}: <ModelVisualizer value={val} /></li>)}</ul>;
    }
    else {
        return String(value);
    }
}
