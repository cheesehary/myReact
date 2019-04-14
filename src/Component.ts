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
  abstract receiveComponent(nextEl: ReactElement): void;
}

export class ReactDOMComponent extends ReactComponent {
  constructor(reactEl: ReactElement) {
    super(reactEl);
  }

  mountComponent(): HTMLElement {
    const element = this._curElement;
    const node = document.createElement(element.type as string);
    this._hostNode = node;
    this.updateDOMProps(null, element.props);
    const children: Array<ChildrenProp> = element.props.children;
    this.appendChildrenNodes(children);
    return node;
  }

  receiveComponent(nextEl: ReactElement) {
    const prevEl = this._curElement;
    this.updateDOMProps(prevEl.props, nextEl.props);
  }

  updateDOMProps(prevProps, nextProps) {
    const node = this._hostNode;
    for (let propKey in prevProps) {
      if (
        nextProps.hasOwnProperty(propKey) ||
        !prevProps.hasOwnProperty(propKey) ||
        prevProps[propKey] == null
      ) {
        continue;
      }
      if (
        ListenerProps.hasOwnProperty(propKey) &&
        typeof prevProps[propKey] === "function"
      ) {
        node.removeEventListener(ListenerProps[propKey], prevProps[propKey]);
      } else {
        node.removeAttribute(propKey);
      }
    }
    for (let propKey in nextProps) {
      if (
        ReservedProps.hasOwnProperty(propKey) ||
        !nextProps.hasOwnProperty(propKey)
      ) {
        continue;
      }
      if (
        ListenerProps.hasOwnProperty(propKey) &&
        typeof nextProps[propKey] === "function"
      ) {
        node.addEventListener(ListenerProps[propKey], nextProps[propKey]);
        if (prevProps[propKey]) {
          node.removeEventListener(ListenerProps[propKey], prevProps[propKey]);
        }
      } else {
        node.setAttribute(propKey, nextProps[propKey]);
      }
    }
  }

  appendChildrenNodes(children: Array<ChildrenProp>) {
    const node = this._hostNode;
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
  public _renderedComponent: ReactComponent;
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
    this._renderedComponent = childComponent;
    return childComponent.mountComponent();
  }

  updateComponent(prevEl: ReactElement, nextEl: ReactElement) {
    const inst = this._instance;
    const nextState = this.processPendingState();
    this._curElement = nextEl;
    inst.state = nextState;
    inst.props = nextEl.props;
    const prevRenderedComponent = this._renderedComponent;
    const prevRenderedEl = prevRenderedComponent._curElement;
    const nextRenderedEl = inst.render();
    if (onlyUpdateComponent(prevRenderedEl, nextRenderedEl)) {
      prevRenderedComponent.receiveComponent(nextRenderedEl);
    }
  }

  receiveComponent(nextEl: ReactElement) {
    const prevEl = this._curElement;
    this.updateComponent(prevEl, nextEl);
  }

  processPendingState() {
    const inst = this._instance;
    const partialState = this._pendingState;
    if (!partialState) {
      return inst.state;
    }
    return Object.assign({}, inst.state, partialState);
  }
}

export class ReactFunctionalComponent extends ReactComponent {
  public _renderedComponent: ReactComponent;

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

  receiveComponent(nextEl: ReactElement) {
    const prevEl = this._curElement;
    this._curElement = nextEl;
    if (onlyUpdateComponent(prevEl, nextEl)) {
      const prevRenderedComponent = this._renderedComponent;
      const type = nextEl.type as SFC;
      const nextRenderedEl = type(nextEl.props);
      prevRenderedComponent.receiveComponent(nextRenderedEl);
    }
  }
}

function onlyUpdateComponent(
  prevEl: ReactElement,
  nextEl: ReactElement
): boolean {
  if (!prevEl && !nextEl) {
    return true;
  }
  if (!prevEl || !nextEl) {
    return false;
  }
  return nextEl.type === prevEl.type;
}
