import { ReactElement, Child, SFC, UpdateType } from "./interfaces";
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
  protected _instantiateComponent: (reactEl: Child) => ReactComponent;
  public _curElement: Child;
  public _hostNode: HTMLElement | Text;
  public _mountIndex: number;

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

  receiveComponent(nextEl: string | number) {
    const prevEl = this._curElement;
    if (prevEl === nextEl) {
      return;
    }
    this._curElement = nextEl;
    this.replaceText(nextEl);
  }

  replaceText(nextEl: string | number) {
    const parentNode = this._hostNode.parentNode;
    while (parentNode.firstChild) {
      parentNode.removeChild(parentNode.firstChild);
    }
    const node = document.createTextNode(nextEl.toString());
    this._hostNode = node;
    parentNode.appendChild(node);
  }
}

export class ReactDOMComponent extends ReactComponent {
  public _curElement: ReactElement;
  protected _renderedChildren: { [index: string]: ReactComponent };

  constructor(reactEl: ReactElement) {
    super(reactEl);
  }

  mountComponent(): HTMLElement {
    const element = this._curElement;
    const node = document.createElement(element.type as string);
    this._hostNode = node;
    this.updateDOMProps(null, element.props);
    this.mountChildren(element.props.children);
    return node;
  }

  receiveComponent(nextEl: ReactElement) {
    const prevEl = this._curElement;
    this.updateDOMProps(prevEl.props, nextEl.props);
    this.updateChildren(nextEl.props.children);
  }

  updateChildren(children: Array<Child>) {
    const prevChildren = this._renderedChildren;
    const nextElements: { [index: string]: Child } = {};
    children.forEach((child, i) => {
      const index = this.getChildIndex(child, i);
      nextElements[index] = child;
    });
    const nextChildren: { [index: string]: ReactComponent } = {};
    const queue: Array<{
      type: UpdateType;
      node: HTMLElement | Text;
      afterNode?: HTMLElement | Text;
    }> = [];
    this.diff(prevChildren, nextElements, nextChildren, queue);
    this._renderedChildren = nextChildren;
    this.processQueue(this._hostNode as HTMLElement, queue);
  }

  processQueue(
    parentNode: HTMLElement,
    queue: Array<{
      type: UpdateType;
      node: HTMLElement | Text;
      afterNode?: HTMLElement | Text;
    }>
  ) {
    queue.forEach(({ type, node, afterNode }) => {
      switch (type) {
        case UpdateType.Remove: {
          parentNode.removeChild(node);
          break;
        }
        case UpdateType.Insert: {
          const referenceNode = afterNode
            ? afterNode.nextSibling
            : parentNode.firstChild;
          parentNode.insertBefore(node, referenceNode);
          break;
        }
      }
    });
  }

  diff(
    prevChildren: { [index: string]: ReactComponent },
    nextElements: { [index: string]: Child },
    nextChildren: { [index: string]: ReactComponent },
    queue: Array<{
      type: UpdateType;
      node: HTMLElement | Text;
      afterNode?: HTMLElement | Text;
    }>
  ) {
    let lastNode: HTMLElement | Text = null;
    let lastIndex = 0;
    Object.entries(nextElements).forEach(([index, nextEl], i) => {
      const prevComponent = prevChildren[index];
      if (
        prevComponent &&
        onlyUpdateComponent(prevComponent._curElement, nextEl)
      ) {
        prevComponent.receiveComponent(nextEl);
        if(prevComponent._mountIndex < lastIndex) {
          queue.push({
            type: UpdateType.Insert,
            node: prevComponent._hostNode,
            afterNode: lastNode
          });
        }
        lastNode = prevComponent._hostNode;
        lastIndex = Math.max(lastIndex, prevComponent._mountIndex);
        prevComponent._mountIndex = i;
        nextChildren[index] = prevComponent;
      } else {
        if (prevComponent) {
          queue.push({
            type: UpdateType.Remove,
            node: prevComponent._hostNode
          });
          lastIndex = Math.max(lastIndex, prevComponent._mountIndex);
        }
        const nextComponent = this._instantiateComponent(nextEl);
        nextComponent._mountIndex = i;
        const nextNode = nextComponent.mountComponent();
        queue.push({
          type: UpdateType.Insert,
          node: nextNode,
          afterNode: lastNode
        });
        lastNode = nextNode;
        nextChildren[index] = nextComponent;
      }
    });
    Object.entries(prevChildren).forEach(([index, prevComponent]) => {
      if (!nextChildren.hasOwnProperty(index)) {
        queue.push({ type: UpdateType.Remove, node: prevComponent._hostNode });
      }
    });
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
        if (prevProps && prevProps[propKey]) {
          node.removeEventListener(ListenerProps[propKey], prevProps[propKey]);
        }
        node.addEventListener(ListenerProps[propKey], nextProps[propKey]);
      } else {
        node.setAttribute(propKey, nextProps[propKey]);
      }
    }
  }

  mountChildren(children: Array<Child>) {
    const node = this._hostNode;
    if (children.length) {
      if (!this._renderedChildren) {
        this._renderedChildren = {};
      }
      children.forEach((child, i) => {
        const childComponent = this._instantiateComponent(child);
        const index = this.getChildIndex(child, i);
        this._renderedChildren[index] = childComponent;
        childComponent._mountIndex = i;
        const childNode = childComponent.mountComponent();
        node.appendChild(childNode);
      });
    }
  }

  getChildIndex = (reactEl: Child, nextIndex: number): string => {
    if (reactEl instanceof ReactElement && reactEl.key !== null) {
      return reactEl.key;
    }
    return "" + nextIndex;
  };
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
    return (
      nextEl instanceof ReactElement &&
      prevEl.type === nextEl.type &&
      prevEl.key === nextEl.key
    );
  }
}
