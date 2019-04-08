import { ReactType, ReactElement, ChildrenProp, Component } from "./interfaces";

function render(reactEl: ReactElement, container: HTMLElement) {
  // const component = instantiateComponent(reactEl);
  const tree = mountComponent(reactEl);
  container.insertBefore(tree, null);
}

export default render;

function mountComponent(reactEl: ReactElement) {
  switch (reactEl._rtype) {
    case ReactType.Dom: {
      const el = document.createElement(reactEl.type as string);
      const children: Array<ChildrenProp> = reactEl.props.children;
      if (children.length) {
        children.forEach(child => {
          if (typeof child === "string" || typeof child === "number") {
            const text = document.createTextNode(child.toString());
            el.appendChild(text);
          } else if (child instanceof ReactElement) {
            const subEl = mountComponent(child);
            el.appendChild(subEl);
          }
        });
      }
      return el;
    }
    case ReactType.Class: {
      const type = reactEl.type;
      //@ts-ignore
      const inst: Component = new type(reactEl.props);
      const renderedEl = inst.render();
      return mountComponent(renderedEl);
    }
    case ReactType.Functional: {
      const type = reactEl.type as Function;
      const renderedEl = type(reactEl.props);
      return mountComponent(renderedEl);
    }
  }
}
