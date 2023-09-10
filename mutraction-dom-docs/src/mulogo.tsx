export function muLogo(size: number){
    const treads = 32;
    let stops = "";

    for (let i = 0; i < treads; i++) {
        const color = i % 2 ? "#0000" : "#000";
        stops += `\n , ${ color } ${ i / treads }turn, ${ color } ${ (i+1) / treads }turn`;
    }

    const logoStyles: Partial<CSSStyleDeclaration> = {
        position: "relative",
        width: `${ size }px`,
        height: `${ size }px`,
        display: "inline-block",
        textAlign: "left",
    };

    const treadStyles: Partial<CSSStyleDeclaration> = {
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
    };

    const muStyles: Partial<CSSStyleDeclaration> = {
        position: "relative",
        left: "26%",
        top: "41%",
        font: `italic bold ${ size * 0.8 }px "Calibri", "Arial", "Helvetica", sans-serif`,
        lineHeight: "0",
    };

    return (
        <div style={logoStyles}>
            <div style={treadStyles}/>
            <div className="primary" style={muStyles}>μ</div>
        </div>
    );
}
