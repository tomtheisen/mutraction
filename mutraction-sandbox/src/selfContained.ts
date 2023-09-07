import { muCompile } from "./compile.js";

const selfContainedTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mutraction Self-Contained App</title>

    <script type="inline-module" name="mutraction-dom">
        __MU_TEMPLATE_LIB__
    </script>

    <script type="inline-module" name="app">
        __MU_TEMPLATE_TRANSFORMED__
    </script>
</head>
<!-- Original source
__MU_TEMPLATE_SOURCE__
-->
<body>
    <script>
        function makeModule(moduleSource) {
            return URL.createObjectURL(new Blob([moduleSource], {type:'application/javascript'}));
        }

        const moduleMap = new Map;
        for (const el of document.querySelectorAll("script[type=inline-module]")) {
            const name = el.getAttribute("name");
            // regexp is jank, might need a better fit
            const source = el.innerText.replace(/\\bfrom\\b\\s*['"]([-.\\w]+)['"']/g, (m, name) => {
                const url = moduleMap.get(name);
                if (!url) throw Error("No inline module found for " + name);
                return \`from "\${ url }"\`;
            });
            moduleMap.set(name, makeModule(source));
        }

        function runModule(name) {
            let el = document.createElement('script');
            el.type = 'module';
            el.src = makeModule(\`import "\${ moduleMap.get(name) }";\`);
            document.body.append(el);
        }

        runModule("app");
    </script>
</body>
</html>
`;

let libSource: string | undefined;
async function getLibSource(): Promise<string> {
    return libSource ??= await (await fetch("mutraction-dom.js")).text();
}

let lastUrl: string | undefined;
export async function getSelfContainedUrl(appSource: string) {
    if (lastUrl) URL.revokeObjectURL(lastUrl);

    const commentSafeSource = appSource.replaceAll("-->", "-- >");
    const html = (await selfContainedTemplate)
        .replace("__MU_TEMPLATE_LIB__", await getLibSource())
        .replace("__MU_TEMPLATE_TRANSFORMED__", muCompile(appSource))
        .replace("__MU_TEMPLATE_SOURCE__", commentSafeSource);
    const blob = new Blob([html]);
    lastUrl = URL.createObjectURL(blob);
    return lastUrl;
}
