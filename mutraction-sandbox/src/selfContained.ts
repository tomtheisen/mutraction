import { muCompile } from "./compile.js";
import { compress } from "./compress.js";

const selfContainedTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mutraction Self-Contained App</title>

    <style>__MU_TEMPLATE_SIMPLE_CSS__</style>

    <script type="inline-module" name="mutraction-dom">
        __MU_TEMPLATE_LIB__
    </script>

    <script type="inline-module" name="app">
        __MU_TEMPLATE_TRANSFORMED__
    </script>

    <template id="mu-sandbox-link-template">
        <span style="position: absolute;right: 1em;top: 0.4em;color: #8888;">made with 
            <a target="_blank" href="https://mutraction.dev/sandbox/#__MU_TEMPLATE_SANDBOX_DATA__" style="font-weight: bold;font-style: italic;text-decoration: none;color: #006aff;" title="Edit the code">μ</a>
        </span>    
    </template>
</head>
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

        document.body.append(document.getElementById("mu-sandbox-link-template").content);
    </script>
</body>
</html>
`;

let libSource: string | undefined;
async function getLibSource(): Promise<string> {
    return libSource ??= await (await fetch("mutraction-dom.js")).text();
}

let simpleCSS: string | undefined;
async function getSimpleCss(): Promise<string> {
    return simpleCSS ??= await (await fetch("assets/simple.css")).text();
}

let lastUrl: string | undefined;
export async function getSelfContainedUrl(appSource: string) {
    if (lastUrl) URL.revokeObjectURL(lastUrl);

    const html = (await selfContainedTemplate)
        .replace("__MU_TEMPLATE_SIMPLE_CSS__", await getSimpleCss())
        .replace("__MU_TEMPLATE_LIB__", await getLibSource())
        .replace("__MU_TEMPLATE_TRANSFORMED__", muCompile(appSource))
        .replace("__MU_TEMPLATE_SANDBOX_DATA__", await compress(appSource));
    const blob = new Blob([html]);
    lastUrl = URL.createObjectURL(blob);
    return lastUrl;
}
