import { makeLocalStyle } from "mutraction-dom";

const treads = 32;
let stops = "";

for (let i = 0; i < treads; i++) {
    const color = i % 2 ? "#0000" : "#000";
    stops += `\n , ${ color } ${ i / treads }turn, ${ color } ${ (i+1) / treads }turn`;
}

const style = makeLocalStyle({
    ".logo": {
        position: "relative",
        display: "inline-block",
        textAlign: "left",
    },
    ".tread": {
        position: "absolute",
        left: "0",
        top: "0",
        display: "inline-block",
        width: "100%",
        height: "100%",
        borderRadius: "100%",
        background: `
            radial-gradient(#fff 40%, #000 41%, #000 63%, #0000 64%),
            conic-gradient(from 90deg at 50% 50%
            ${ stops }`,
        animation: "rotating 20s linear infinite",
    },
    ".mu": {
        position: "relative",
        left: "26%",
        top: "41%",
        color: "var(--primary-color)",
        font: `italic bold 100% "Calibri", "Arial", "Helvetica", sans-serif`,
        lineHeight: "0",
    }
})

export function muLogo(size: number){
    return (
        <div className="logo" mu:apply={ style } style={{ width: `${ size }px`, height: `${ size }px` }}>
            <div className="tread" />
            <div className="mu primary" style={{ fontSize: `${ size * 0.8 }px` }}>μ</div>
        </div>
    );
}
