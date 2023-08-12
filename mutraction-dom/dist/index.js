// out/runtime.js
import { effect } from "mutraction";
var tracker = null;
var suppress = { suppressUntrackedWarning: true };
function element(name, attrGetters, ...children) {
  const el = document.createElement(name);
  let blank = void 0;
  for (let [name2, attrGetter] of Object.entries(attrGetters ?? {})) {
    if (name2 === "if") {
      effect(tracker, () => {
        if (attrGetter())
          blank?.replaceWith(el);
        else
          el.replaceWith(blank ??= document.createTextNode(""));
      }, suppress);
    } else if (name2 === "style") {
      effect(tracker, () => Object.assign(el.style, attrGetter()), suppress);
    } else if (name2 === "classList") {
      effect(tracker, () => {
        const classMap = attrGetter();
        for (const e of Object.entries(classMap))
          el.classList.toggle(...e);
      }, suppress);
    } else {
      effect(tracker, () => el[name2] = attrGetter(), suppress);
    }
  }
  el.append(...children);
  return blank ?? el;
}
function child(getter) {
  const result = getter();
  if (result instanceof HTMLElement)
    return result;
  if (result instanceof Text)
    return result;
  let node = document.createTextNode("");
  effect(tracker, () => {
    const newNode = document.createTextNode(String(getter() ?? ""));
    node.replaceWith(newNode);
    node = newNode;
  }, suppress);
  return node;
}

// out/compile-jsx.js
import * as BabelCoreNamespace from "@babel/core";
var t = BabelCoreNamespace.types;
function jsxChild(child2) {
  const type = child2.type;
  if (type === "JSXText") {
    const value = child2.value.trim();
    if (value === "")
      return null;
    return t.stringLiteral(value);
  } else if (type === "JSXElement") {
    return child2;
  } else if (type === "JSXExpressionContainer") {
    if (child2.expression.type === "JSXEmptyExpression")
      return null;
    return t.callExpression(t.identifier(ctx.childFnName), [
      t.arrowFunctionExpression([], child2.expression)
    ]);
  } else if (type === "JSXFragment") {
    return t.stringLiteral("NIE fragment");
  } else if (type === "JSXSpreadChild") {
    return t.stringLiteral("NIE spread child");
  }
  throw Error("Unsupported child type " + type);
}
function jsxId2Id(name) {
  if (name.type === "JSXIdentifier")
    return t.identifier(name.name);
  return t.memberExpression(jsxId2Id(name.object), t.identifier(name.property.name));
}
function jsxProp(attr) {
  const type = attr.type;
  if (type === "JSXAttribute") {
    if (attr.name.type === "JSXNamespacedName")
      throw Error("Unsupported namespace in JSX attribute");
    return t.objectProperty(t.identifier(attr.name.name), jsxAttrVal2Prop(attr.value));
  } else if (type === "JSXSpreadAttribute") {
    return t.spreadElement(attr.argument);
  }
  throw Error("Unsupported attribute type: " + type);
}
function jsxAttrVal2Prop(attrVal) {
  if (!attrVal)
    return t.booleanLiteral(true);
  const type = attrVal.type;
  if (type === "StringLiteral") {
    return t.stringLiteral(attrVal.value);
  } else if (type === "JSXExpressionContainer") {
    if (attrVal.expression.type === "JSXEmptyExpression")
      return t.booleanLiteral(true);
    return t.arrowFunctionExpression([], attrVal.expression);
  } else {
    return attrVal;
  }
}
var ctx = void 0;
var mutractPlugin = {
  visitor: {
    Program: {
      enter(path) {
        path.node.sourceType = "module";
        const elementFnName = path.scope.generateUid("mu_element");
        const childFnName = path.scope.generateUid("mu_child");
        ctx = { elementFnName, childFnName };
        path.node.body.unshift(t.importDeclaration([
          t.importSpecifier(t.identifier(elementFnName), t.identifier("element")),
          t.importSpecifier(t.identifier(childFnName), t.identifier("child"))
        ], t.stringLiteral("mutraction-dom")));
      },
      exit(path) {
        ctx = void 0;
      }
    },
    JSXElement(path) {
      const { name } = path.node.openingElement;
      if (name.type === "JSXNamespacedName")
        throw path.buildCodeFrameError("This JSX element type is not supported");
      const props = path.node.openingElement.attributes.map(jsxProp);
      try {
        if (name.type === "JSXIdentifier" && /^[a-z]/.test(name.name)) {
          const jsxChildren = [];
          for (const child2 of path.node.children) {
            const compiled = jsxChild(child2);
            if (compiled)
              jsxChildren.push(compiled);
          }
          path.replaceWith(t.callExpression(t.identifier(ctx.elementFnName), [
            t.stringLiteral(name.name),
            t.objectExpression(props),
            ...jsxChildren
          ]));
          return;
        }
        path.replaceWith(t.callExpression(jsxId2Id(name), [t.objectExpression(props)]));
      } catch (err) {
        path.buildCodeFrameError(err instanceof Error ? err.message : String(err));
      }
    }
  }
};
function compile_jsx_default(_) {
  return mutractPlugin;
}

// out/index.js
var out_default = compile_jsx_default;
export {
  child,
  out_default as default,
  element
};
