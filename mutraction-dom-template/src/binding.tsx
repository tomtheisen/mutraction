import { track } from "mutraction-dom";

export function binding() {
    const model = track({ text: "initial", scrollPos: 0 });

    return (
        <>
            <div>
                <input mu:syncEvent="input" maxLength={10} value={model.text} />
                <input mu:syncEvent="input" maxLength={10} value={model.text} />
                <input maxLength={10} value={model.text} />
                <input maxLength={10} {...{value: model.text}} />
            </div>
            <div>Scroll pos: {model.scrollPos}</div>
            <div mu:syncEvent="scroll" scrollTop={model.scrollPos} style={{ overflow: "scroll", maxHeight: "100px" }}>
                <div style={{ height: "200px" }}></div>
            </div>
        </>
    );
}
