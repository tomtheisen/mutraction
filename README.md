# μ-traction

![mutraction logo](logo.png)

## Transactional reactive state management

Everything is real DOM nodes and mutation.  Proxies are used to track dependencies.

```js
const model = track({ clicks: 0});
const app = (
    <button onclick={() => ++model.clicks }>
        { model.clicks } clicks
    </button>
);

document.body.append(app);
```

Try it now locally from a project template.

```
npx degit github:tomtheisen/mutraction/mutraction-dom-template
npm install
npm run build
```

Or you can try the [sandbox](https://mutraction.dev/sandbox/).

Check the website for docs.  
https://mutraction.dev/
