import { makeZip } from "client-zip";

function getBabelRc() {
    return `
{
    "plugins": ["@babel/plugin-syntax-jsx", "mutraction-dom/compile-jsx"]
}`.trim();
}

function getIndexHtml() {
    return `
<!DOCTYPE html>
<html>
    <head>
        <title>mutracted dom</title>
    </head>
    <body>
        <script src="dist/index.js"></script>
    </body>
</html>`.trim();
}

function getPackageJson() {
    return `
{
  "name": "mutraction-dom-template",
  "type": "module",
  "version": "1.0.0",
  "description": "template for a starter mutraction-dom project",
  "scripts": {
    "build": "npx tsc && npm run transform && npm run bundle",
    "transform": "npx babel out -d out2",
    "bundle": "npx esbuild out2/index.js --bundle --format=esm --outfile=dist/index.js"
  },
  "devDependencies": {
    "@babel/cli": "^7.22.10",
    "@babel/core": "^7.22.10",
    "@babel/preset-env": "^7.22.10",
    "esbuild": "^0.19.1",
    "typescript": "^5.1.6"
  },
  "dependencies": {
    "mutraction-dom": "x"
  }
}`.trim();
}

function getTsConfig() {
    return `
{
  "compilerOptions": {
    "target": "ES2022",
    "jsx": "preserve",
    "jsxImportSource": "mutraction-dom",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./out/",
    "strict": true,
    "noImplicitAny": true,
  },
  "include": ["src"]
}`.trim();
}

function getReadme() {
    return `
# Mutraction sample app scaffolding

This project template was downloaded from https://mutraction.dev/sandbox/

## Next Steps

To get up and running, you need to install Node or similar if you haven't already.
https://nodejs.org/

Next, run these commands.

    npm install
    npm run build

Then open \`index.html\` in your web browser.

More information and documentation is available at https://mutraction.dev/
`.trim();
}

let lastUrl: string | undefined;
export async function getScaffoldZipUrl(appSource: string): Promise<string> {
    if (lastUrl) URL.revokeObjectURL(lastUrl);

    const files = [
        new File([appSource], "src/index.tsx"),
        new File([getBabelRc()], ".babelrc"),
        new File([getIndexHtml()], "index.html"),
        new File([getPackageJson()], "package.json"),
        new File([getTsConfig()], "tsconfig.json"),
        new File([getReadme()], "README.md"),
    ];

    const readableStream = await makeZip(files);
    const headers = { 
        "content-disposition": 'attachment; filename="mutraction-project.zip"', 
        "content-type": "application/zip",
    };
    const response = new Response(readableStream, { headers });
    const blob = await response.blob();
    lastUrl = URL.createObjectURL(blob);
    return lastUrl;
}
