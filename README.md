# μ-traction

![mutraction logo](logo.png)

## Transactional reactive state management

```js
const model = track({ clicks: 0});
const app = (
    <button onclick={() => ++model.clicks }>
        { model.clicks } clicks
    </button>
);

document.body.append(app);
```

Check the website for docs.  
https://mutraction.dev/
