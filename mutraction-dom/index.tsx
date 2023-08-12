import { track, effect, Tracker } from 'mutraction';

type ElementProps<E extends keyof HTMLElementTagNameMap> = {
    [K in keyof HTMLElementTagNameMap[E]]?: () => HTMLElementTagNameMap[E][K];
} & {
    if?: () => boolean;
}; 

// function element(name: string, attrs: Record<string, () => string|number|boolean>, ...children: ChildNode[]): HTMLElement;
function element<E extends keyof HTMLElementTagNameMap>(
    name: E, 
    attrGetters: ElementProps<E>, 
    ...children: (Node | string)[]
): HTMLElementTagNameMap[E] {
    const el = document.createElement(name);
    let blank: Text | undefined = undefined;
    for (let [name, attrGetter] of Object.entries(attrGetters ?? {})) {
        if (name === "if") {
            // effect(tracker, () => {
            //     if (attrGetter()) {
            //         blank?.replaceWith(el);
            //     }
            //     else {
            //         el.replaceWith(blank ??= document.createTextNode(""));
            //     }
            // });
        }
        else {
            effect(tracker, () => (el as any)[name] = attrGetter());
        }
    }
    el.append(...children);
    return blank ?? el;
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

const [model, tracker] = track({ val: "hello", tab: 5, show: false });

const d = element("div", { tabIndex: () => model.tab },
    child(() => model.val),
    child(() => element("p", { if: () => model.show }, "lorem")),
    child(() => element("p", { if: () => false }, "never"))
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

setInterval(() => model.show = !model.show, 1000);