import { ReactElement, IComponent } from "./interfaces";
import ReactComponent from "./ReactComponent";
import ReactInstanceMap from "./ReactInstanceMap";

export default class ReactClassComponent extends ReactComponent {
  public _curElement: ReactElement;
  protected _instance: IComponent;
  protected _renderedComponent: ReactComponent;
  public _pendingState;

  constructor(reactEl: ReactElement) {
    super(reactEl);
  }

  mountComponent(): HTMLElement {
    const element = this._curElement;
    const type = element.type;
    //@ts-ignore
    const inst: IComponent = new type(element.props);
    this._instance = inst;
    ReactInstanceMap.set(inst, this);
    if(inst.componentWillMount) {

    }
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
    if (this.onlyUpdateComponent(prevRenderedEl, nextRenderedEl)) {
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
