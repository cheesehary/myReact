import { ReactElement, ChildrenProp, SFC } from "./interfaces";
import { ReservedProps, ListenerProps } from "./dom";

const ReactInstanceMap = new WeakMap<object, ReactClassComponent>();

export class Component<P = {}, S = {}> {
  public props: Readonly<P>;
  public state: Readonly<S>;

  constructor(props: Readonly<P>) {
    this.props = props;
  }
  setState(partialState: Partial<S>) {
    const component = ReactInstanceMap.get(this);
    component._pendingState = partialState;
    component.updateComponent(component._curElement, component._curElement);
  }
  render(): ReactElement {
    return;
  }
}

export abstract class ReactComponent {
  protected _instantiateComponent: (reactEl: ReactElement) => ReactComponent;
  public _curElement: ReactElement;
  public _hostNode: HTMLElement;

  constructor(reactEl: ReactElement) {
    this._curElement = reactEl;
  }
  abstract mountComponent(): HTMLElement;
}

export class ReactDOMComponent extends ReactComponent {
  constructor(reactEl: ReactElement) {
    super(reactEl);
  }

  mountComponent(): HTMLElement {
    const element = this._curElement;
    const node = document.createElement(element.type as string);
    this._hostNode = node;
    this.updateDOMProps(node, element.props);
    const children: Array<ChildrenProp> = element.props.children;
    this.appendChildrenNodes(node, children);
    return node;
  }

  updateDOMProps(node: HTMLElement, props) {
    for (let propKey in props) {
      if (ReservedProps.hasOwnProperty(propKey)) {
        continue;
      }
      if (
        ListenerProps.hasOwnProperty(propKey) &&
        typeof props[propKey] === "function"
      ) {
        node.addEventListener(ListenerProps[propKey], props[propKey]);
      } else {
        node.setAttribute(propKey, props[propKey]);
      }
    }
  }

  appendChildrenNodes(node: HTMLElement, children: Array<ChildrenProp>) {
    if (children.length) {
      children.forEach(child => {
        if (typeof child === "string" || typeof child === "number") {
          const textNode = document.createTextNode(child.toString());
          node.appendChild(textNode);
        } else if (child instanceof ReactElement) {
          const childComponent = this._instantiateComponent(child);
          const childNode = childComponent.mountComponent();
          node.appendChild(childNode);
        }
      });
    }
  }
}

export class ReactClassComponent extends ReactComponent {
  public _instance: Component;
  public _pendingState;

  constructor(reactEl: ReactElement) {
    super(reactEl);
  }

  mountComponent(): HTMLElement {
    const element = this._curElement;
    const type = element.type;
    //@ts-ignore
    const inst: Component = new type(element.props);
    this._instance = inst;
    ReactInstanceMap.set(inst, this);
    const renderedEl = inst.render();
    const childComponent = this._instantiateComponent(renderedEl);
    return childComponent.mountComponent();
  }

  updateComponent(prevEl: ReactElement, nextEl: ReactElement) {
    const inst = this._instance;
    const nextState = this.processPendingState();
    inst.state = nextState;
    inst.props = nextEl.props;
    if(onlyUpdateComponent(prevEl, nextEl)) {

    }
  }
}

export class ReactFunctionalComponent extends ReactComponent {
  constructor(reactEl: ReactElement) {
    super(reactEl);
  }

  mountComponent(): HTMLElement {
    const element = this._curElement;
    const type = element.type as SFC;
    const renderedEl = type(element.props);
    const childComponent = this._instantiateComponent(renderedEl);
    return childComponent.mountComponent();
  }
}
