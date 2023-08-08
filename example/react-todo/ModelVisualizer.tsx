import * as React from "react";

export function ModelVisualizer({ value }: { value: unknown; }) {
    const ref = React.useRef<HTMLElement>(null);

    React.useEffect(() => {
        if (!ref.current) return;
        const el = ref.current;
        el.style.backgroundColor = "aqua";
        setTimeout(() => el.style.backgroundColor = "", 200);
    });

    if (Array.isArray(value)) {
        return <ol ref={ ref as any }>{value.map((e, i) => 
            <li key={ i }>
                <ModelVisualizer value={ e } />
            </li>)}</ol>;
    }
    else if (typeof value === "object" && value) {
        return <ul ref={ ref as any }>{
            Object.entries(value).map(([key, val]) => 
                <li key={ key }>
                    { key }: <ModelVisualizer value={ val } />
                </li>)
        }</ul>;
    }
    else if (typeof value === "string") {
        return JSON.stringify(value);
    }
    else {
        return <span ref={ ref as any }>{ String(value) }</span>;
    }
}
