function serializableMakeLocalSheet() {
    const blocks = [
        `[data-mutraction-devtool-highlight] {
            outline: solid #f0f6 8px !important;
            background: #0ff3 !important;
            cursor: pointer;
        }`
    ];

    const sheet = new CSSStyleSheet;
    for (const rules of blocks) {
        sheet.insertRule(rules, 0);
    }
    document.adoptedStyleSheets.push(sheet);
}

async function init() {
    console.log("[panel] init");
    await shipFunction(serializableMakeLocalSheet);

    const versionEl = document.getElementById("version");
    const version = await shipFunction(() => window[Symbol.for("mutraction-dom")]?.version );

    document.getElementById("initial").hidden = true;
    if (version) {
        document.getElementById("connected").hidden = false;
        versionEl.innerText = version;
    }
    else {
        document.getElementById("disconnected").hidden = false;
    }
}
