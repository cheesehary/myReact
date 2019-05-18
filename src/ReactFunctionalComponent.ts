import { ReactElement, SFC } from "./interfaces";
import ReactComponent from "./ReactComponent";
import { MountTransaction } from "./reconciler";

export default class ReactFunctionalComponent extends ReactComponent {
  public _curElement: ReactElement;
  private _renderedComponent: ReactComponent;

  constructor(reactEl: ReactElement) {
    super(reactEl);
  }

  mountComponent(transaction: MountTransaction): HTMLElement {
    const element = this._curElement;
    const type = element.type as SFC;
    const renderedEl = type(element.props);
    const childComponent = this._instantiateComponent(renderedEl);
    this._renderedComponent = childComponent;
    return childComponent.mountComponent(transaction) as HTMLElement;
  }

  receiveComponent(transaction: MountTransaction, nextEl: ReactElement) {
    const prevRenderedComponent = this._renderedComponent;
    const prevRenderedEl = prevRenderedComponent._curElement;
    const nextType = nextEl.type as SFC;
    const nextRenderedEl = nextType(nextEl.type);
    this._curElement = nextEl;
    if (this.onlyUpdateComponent(prevRenderedEl, nextRenderedEl)) {
      prevRenderedComponent.receiveComponent(transaction, nextRenderedEl);
    } else {
      prevRenderedComponent.unmountComponent();
      const nextRenderedComponent = this._instantiateComponent(nextRenderedEl);
      const newNode = nextRenderedComponent.mountComponent(transaction);
      const oldNode = prevRenderedComponent.getHostNode();
      this._renderedComponent = nextRenderedComponent;
      oldNode.parentNode.replaceChild(newNode, oldNode);
    }
  }

  getHostNode() {
    return this._renderedComponent.getHostNode();
  }

  unmountComponent() {
    if (this._renderedComponent) {
      this._renderedComponent.unmountComponent();
    }
    this._curElement = null;
    this._renderedComponent = null;
  }
}
