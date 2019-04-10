import { ReactType, ReactElement, ChildrenProp, SFC } from "./interfaces";

export abstract class Component<P = {}, S = {}> {
  public props: Readonly<P>;
  public state: Readonly<S>;

  constructor(props: Readonly<P>) {
    this.props = props;
  }
  abstract render(): ReactElement;
}

export abstract class ReactComponent {
  protected _instantiateComponent: (reactEl: ReactElement) => ReactComponent;
  public _curElement: ReactElement;
  public _instance: Function;

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
    const children: Array<ChildrenProp> = element.props.children;
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
    return node;
  }
}

export class ReactClassComponent extends ReactComponent {
  constructor(reactEl: ReactElement) {
    super(reactEl);
  }

  mountComponent(): HTMLElement {
    const element = this._curElement;
    const type = element.type;
    //@ts-ignore
    const inst: Component = new type(element.props);
    const renderedEl = inst.render();
    const childComponent = this._instantiateComponent(renderedEl);
    return childComponent.mountComponent();
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
