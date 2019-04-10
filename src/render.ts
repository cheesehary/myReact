import { ReactType, ReactElement, ChildrenProp } from "./interfaces";
import {
  Component,
  ReactComponent,
  ReactDOMComponent,
  ReactClassComponent,
  ReactFunctionalComponent
} from "./Component";

function render(reactEl: ReactElement, container: HTMLElement) {
  const component = instantiateComponent(reactEl);
  const node = component.mountComponent();
  container.insertBefore(node, null);
}

export default render;

function instantiateComponent(reactEl: ReactElement) {
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
}

Object.assign(ReactComponent.prototype, {
  _instantiateComponent: instantiateComponent
});
