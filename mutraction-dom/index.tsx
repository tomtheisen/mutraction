import { track, effect, Tracker } from 'mutraction';

type AttributeType<E extends keyof HTMLElementTagNameMap, K extends keyof HTMLElementTagNameMap[E]> = 
    K extends "style" ? Partial<CSSStyleDeclaration> :
    K extends "classList" ? Record<string, boolean> :
    HTMLElementTagNameMap[E][K];

type ElementProps<E extends keyof HTMLElementTagNameMap> = {
    [K in keyof HTMLElementTagNameMap[E]]?:
        () => AttributeType<E, K>;
} & {
    if?: () => boolean;
}; 

const suppress = { suppressUntrackedWarning: true } as const;

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
            effect(tracker, () => {
                if (attrGetter()) blank?.replaceWith(el);
                else el.replaceWith(blank ??= document.createTextNode(""));
            }, suppress);
        }
        else if (name === "style") {
            effect(tracker, () => Object.assign(el.style, attrGetter()), suppress);
        }
        else if (name === "classList") {
            effect(tracker, () => {
                const classMap = attrGetter() as Record<string, boolean>;
                for (const e of Object.entries(classMap)) el.classList.toggle(...e);
            }, suppress);
        }
        else {
            effect(tracker, () => (el as any)[name] = attrGetter(), suppress);
        }
    }
    el.append(...children);
    return blank ?? el;
}

function child(getter: () => number | string | bigint | null | undefined | HTMLElement | Text): ChildNode {
    const result = getter();
    if (result instanceof HTMLElement) return result;
    if (result instanceof Text) return result;
    let node = document.createTextNode("");
    effect(tracker, () => {
        const newNode = document.createTextNode(String(getter() ?? ""));
        node.replaceWith(newNode);
        node = newNode;
    }, suppress);
    return node;
}

const [model, tracker] = track({ val: "hello", tab: 5, show: false });

const d = element("div", { tabIndex: () => model.tab },
    child(() => model.val),
    child(() => element("p", {}, "just something")),
    child(() => element("p", { classList: () => ({ stinky: model.show }) }, "touch of class")),
    element("p", { style: () => ({ outline: "green solid 2px" }) }, "just something unwrapped once"),
    child(() => element("p", { if: () => model.show }, "intermittently")),
    child(() => element("p", { if: () => false }, "never")),
    ""
);

/*
const b = <div tabIndex={model.tab}>{model.val}</div>;
//*/


document.getElementById("root")?.replaceChildren(d);

let x = 0;
setInterval(() => {
    model.val = ++x + "";
}, 100);

setInterval(() => {
    model.tab++;
}, 250);

setInterval(() => model.show = !model.show, 1000);