function getConfig(name: string): string | undefined {
    const meta = globalThis.document?.querySelector(`meta[name=${name.replace(/\W/g, "\\$&")}]`);
    return meta?.getAttribute("value") ?? undefined;
}

export const showMarkers = !!getConfig("mu:show-markers");