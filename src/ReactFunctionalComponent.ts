import { ReactElement, SFC } from "./interfaces";
import ReactComponent from "./ReactComponent";

export default class ReactFunctionalComponent extends ReactComponent {
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
    if (this.onlyUpdateComponent(prevEl, nextEl)) {
      const prevRenderedComponent = this._renderedComponent;
      const type = nextEl.type as SFC;
      const nextRenderedEl = type(nextEl.props);
      prevRenderedComponent.receiveComponent(nextRenderedEl);
    }
  }
}
