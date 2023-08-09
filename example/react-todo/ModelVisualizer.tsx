import { key } from "mutraction-react";
import * as React from "react";

function keyOrString(val: any) {
    if (typeof val === "object") return key(val);
    return String(val);
}

export function ModelVisualizer({ value }: { value: unknown; }) {
    const ref = React.useRef<HTMLElement>(null);

    React.useEffect(() => {
        if (!ref.current) return;
        const el = ref.current;
        el.style.backgroundColor = "aqua";
        setTimeout(() => el.style.backgroundColor = "white", 200);
    });

    if (Array.isArray(value)) {
        return <details open ref={ ref as any }>
            <summary>[ ... ]</summary>
            <ol style={{margin:0}} start={0}>{value.map(e => 
                <li key={ keyOrString(e) }>
                    <ModelVisualizer value={ e } />
                </li>)}
            </ol>
        </details>;
    }
    else if (typeof value === "object" && value) {
        return <details open ref={ ref as any }>
            <summary>{"{ ... }"}</summary>
            <ul style={{margin:0}}>{
                Object.entries(value).map(([key, val]) => 
                    <li key={ key }>
                        { key }: <ModelVisualizer value={ val } />
                    </li>)
            }</ul>
        </details>;
    }
    else if (typeof value === "string") {
        return JSON.stringify(value);
    }
    else {
        return <span ref={ ref as any }>{ String(value) }</span>;
    }
}
