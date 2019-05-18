import {
  ReactElement,
  IComponent,
  IReactClassComponent,
  IReactComponent
} from "./interfaces";
import ReactComponent from "./ReactComponent";
import ReactInstanceMap from "./ReactInstanceMap";
import { MountTransaction } from "./reconciler";

let nextOrder = 0;

export default class ReactClassComponent extends ReactComponent
  implements IReactClassComponent {
  public _curElement: ReactElement;
  public _instance: IComponent;
  private _renderedComponent: IReactComponent;
  public _pendingStates: Array<Object | Function>;
  public _pendingCallbacks: Array<Function>;
  public _mountOrder: number;

  constructor(reactEl: ReactElement) {
    super(reactEl);
  }

  mountComponent(transaction: MountTransaction): HTMLElement {
    this._mountOrder = nextOrder++;
    const element = this._curElement;
    const type = element.type;
    //@ts-ignore
    const inst: IComponent = new type(element.props);
    this._instance = inst;
    ReactInstanceMap.set(inst, this);
    if (inst.componentWillMount) {
      inst.componentWillMount();
    }
    const renderedEl = inst.render();
    const childComponent = this._instantiateComponent(renderedEl);
    this._renderedComponent = childComponent;
    const node = childComponent.mountComponent(transaction) as HTMLElement;
    if (inst.componentDidMount) {
      transaction.enqueue(inst.componentDidMount.bind(inst));
    }
    return node;
  }

  updateComponentIfNecessary(transaction: MountTransaction) {
    if (this._pendingStates) {
      this.updateComponent(transaction, this._curElement, this._curElement);
    }
  }

  updateComponent(
    transaction: MountTransaction,
    prevEl: ReactElement,
    nextEl: ReactElement
  ) {
    const inst = this._instance;
    if (prevEl !== nextEl && inst.componentWillReceiveProps) {
      inst.componentWillReceiveProps(nextEl.props);
    }
    const nextState = this.processPendingStates();
    this._curElement = nextEl;
    let shouldUpdate = true;
    if (inst.shouldComponentUpdate) {
      shouldUpdate = inst.shouldComponentUpdate(nextEl.props, nextState);
    }
    if (shouldUpdate) {
      if (inst.componentWillUpdate) {
        inst.componentWillUpdate(nextEl.props, nextState);
      }
      let prevProps;
      let prevState;
      if (inst.componentDidUpdate) {
        prevProps = inst.props;
        prevState = inst.state;
      }
      inst.state = nextState;
      inst.props = nextEl.props;
      this.updateRenderedComponent(transaction);
      if (inst.componentDidUpdate) {
        transaction.enqueue(
          inst.componentDidUpdate.bind(inst, prevProps, prevState)
        );
      }
    } else {
      inst.state = nextState;
      inst.props = nextEl.props;
    }
  }

  updateRenderedComponent(transaction: MountTransaction) {
    const inst = this._instance;
    const prevRenderedComponent = this._renderedComponent;
    const prevRenderedEl = prevRenderedComponent._curElement;
    const nextRenderedEl = inst.render();
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

  receiveComponent(transaction: MountTransaction, nextEl: ReactElement) {
    const prevEl = this._curElement;
    this.updateComponent(transaction, prevEl, nextEl);
  }

  processPendingStates(): object {
    const inst = this._instance;
    const partialStates = this._pendingStates;
    this._pendingStates = null;
    if (!partialStates) {
      return inst.state;
    }
    const nextState = Object.assign({}, inst.state);
    partialStates.forEach(partial => {
      Object.assign(
        nextState,
        typeof partial === "function"
          ? partial.call(inst, nextState, inst.props)
          : partial
      );
    });
    return nextState;
  }

  getHostNode() {
    return this._renderedComponent.getHostNode();
  }

  unmountComponent() {
    const inst = this._instance;
    if (inst.componentWillUnmount) {
      inst.componentWillUnmount();
    }
    if (this._renderedComponent) {
      this._renderedComponent.unmountComponent();
    }
    this._instance = null;
    this._curElement = null;
    this._renderedComponent = null;
    this._pendingStates = null;
    this._pendingCallbacks = null;
    ReactInstanceMap.delete(inst);
  }
}
