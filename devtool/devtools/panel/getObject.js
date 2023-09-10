function serializableGetObject(id) {
    const { objectRepository } = window[Symbol.for("mutraction-dom")];

    const obj = objectRepository.getObject(Number(id));
    console.log("[serializableGetObject] called", { id, obj });
    if (!obj) return undefined;

    return Object.entries(obj).map(e => {
        if (e[1] === null || typeof e[1] !== "object") return e;
        return [e[0], { id: objectRepository.getId(e[1]) } ];
    });
}
