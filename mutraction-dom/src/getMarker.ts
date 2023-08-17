const debug = false;
let id = 10_000;

export function getMarker(mark: string = "mark") {
    return document.createTextNode(debug ? `⟪${ mark }:${ String(++id) }⟫` : "");
}
