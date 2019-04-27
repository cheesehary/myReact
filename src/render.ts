import { ReactType, ReactElement, Child } from "./interfaces";
import ReactComponent from "./ReactComponent";
import ReactDOMComponent from "./ReactDOMComponent";
import ReactClassComponent from "./ReactClassComponent";
import ReactFunctionalComponent from "./ReactFunctionalComponent";
import ReactTextComponent from "./ReactTextComponent";

function render(reactEl: ReactElement, container: HTMLElement) {
  const component = instantiateComponent(reactEl);
  const node = component.mountComponent();
  container.insertBefore(node, null);
}

export default render;

function instantiateComponent(reactEl: Child) {
  if (reactEl instanceof ReactElement) {
    switch (reactEl._rtype) {
      case ReactType.Dom: {
        return new ReactDOMComponent(reactEl);
      }
      case ReactType.Class: {
        return new ReactClassComponent(reactEl);
      }
      case ReactType.Functional: {
        return new ReactFunctionalComponent(reactEl);
      }
    }
  } else {
    return new ReactTextComponent(reactEl);
  }
}

Object.assign(ReactComponent.prototype, {
  _instantiateComponent: instantiateComponent
});
