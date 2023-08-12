import { track, effect, Tracker } from 'mutraction';

// function element(name: string, attrs: Record<string, () => string|number|boolean>, ...children: ChildNode[]): HTMLElement;
function element<E extends keyof HTMLElementTagNameMap>(
    name: E, 
    attrGetters: { [K in keyof HTMLElementTagNameMap[E]]?: () => HTMLElementTagNameMap[E][K] }, 
    ...children: (Node | string)[]
): HTMLElementTagNameMap[E] {
    const el = document.createElement(name);
    for (let [name, attrGetter] of Object.entries(attrGetters ?? {})) {
        effect(tracker, () => (el as any)[name] = attrGetter());
    }
    el.append(...children);
    return el;
}

function child(getter: () => number | string | bigint | null | undefined | HTMLElement): ChildNode {
    const result = getter();
    if (result instanceof HTMLElement) return result;
    let node = document.createTextNode("");
    effect(tracker, () => {
        const newNode = document.createTextNode(String(getter() ?? ""));
        node.replaceWith(newNode);
        node = newNode;
    });
    return node;
}

const [model, tracker] = track({ val: "hello", tab: 5 });

const d = element("div", { tabIndex: () => model.tab },
    child(() => model.val),
    element("p", {}, "lorem")
);

/*
const b = <div tabIndex={model.tab}>{model.val}</div>;
//*/


document.getElementById("root")?.appendChild(d);

let x = 0;
setInterval(() => {
    model.val = ++x + "";
}, 100);

setInterval(() => {
    model.tab++;
}, 250);

