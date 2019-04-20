import { ReactElement, Child, SFC } from "./interfaces";
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
  public _curElement: Child;
  protected _hostNode: HTMLElement | Text;

  constructor(reactEl: Child) {
    this._curElement = reactEl;
  }
  abstract mountComponent(): HTMLElement | Text;
  abstract receiveComponent(nextEl: Child): void;
}

export class ReactTextComponent extends ReactComponent {
  public _curElement: number | string;

  constructor(reactEl: number | string) {
    super(reactEl);
  }

  mountComponent(): Text {
    const element = this._curElement;
    const node = document.createTextNode(element.toString());
    this._hostNode = node;
    return node;
  }

  receiveComponent(nextEl: string | number) {}
}

export class ReactDOMComponent extends ReactComponent {
  public _curElement: ReactElement;
  protected _renderedChildren: { [name: string]: ReactComponent };

  constructor(reactEl: ReactElement) {
    super(reactEl);
  }

  mountComponent(): HTMLElement {
    const element = this._curElement;
    const node = document.createElement(element.type as string);
    this._hostNode = node;
    this.updateDOMProps(null, element.props);
    const children: Array<Child> = element.props.children;
    this.appendChildrenNodes(children);
    return node;
  }

  receiveComponent(nextEl: ReactElement) {
    const prevEl = this._curElement;
    this.updateDOMProps(prevEl.props, nextEl.props);
  }

  updateDOMProps(prevProps, nextProps) {
    const node = this._hostNode as HTMLElement;
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

  appendChildrenNodes(children: Array<Child>) {
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
  public _curElement: ReactElement;
  protected _instance: Component;
  protected _renderedComponent: ReactComponent;
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
    return childComponent.mountComponent() as HTMLElement;
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
  public _curElement: ReactElement;
  protected _renderedComponent: ReactComponent;

  constructor(reactEl: ReactElement) {
    super(reactEl);
  }

  mountComponent(): HTMLElement {
    const element = this._curElement;
    const type = element.type as SFC;
    const renderedEl = type(element.props);
    const childComponent = this._instantiateComponent(renderedEl);
    return childComponent.mountComponent() as HTMLElement;
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

function onlyUpdateComponent(prevEl: Child, nextEl: Child): boolean {
  if (!prevEl && !nextEl) {
    return true;
  }
  if (!prevEl || !nextEl) {
    return false;
  }
  if (typeof prevEl === "string" || typeof prevEl === "number") {
    return typeof nextEl === "string" || typeof nextEl === "number";
  } else {
    return nextEl instanceof ReactElement && prevEl.type === nextEl.type;
  }
}
