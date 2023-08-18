
function getConfig(name: string): string | undefined {
    return document.querySelector(`meta[name=${name.replace(/\W/g, "\\$&")}]`)?.getAttribute("value") ?? undefined;
}

export const showMarkers = !!getConfig("mu:show-markers");