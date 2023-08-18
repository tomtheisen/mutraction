import { showMarkers } from "./config.js";

export function getMarker(mark: string) {
    return document.createTextNode(showMarkers ? `⟪${ mark }⟫` : "");
}
