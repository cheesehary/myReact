export enum ReactType {
  Dom,
  Class,
  Functional
}

export type Child = ReactElement | string | number;

export class ReactElement {
  public _rtype: ReactType;
  public type: Function | SFC | string;
  public props: { [prop: string]: any };
  public key: string;

  constructor({ _rtype, type, props, key }) {
    this._rtype = _rtype;
    this.type = type;
    this.props = props;
    this.key = key;
  }
}

export interface SFC<P = {}> {
  (props: Readonly<P>): ReactElement;
}

export enum UpdateType {
  Insert,
  Remove
}

export interface IComponent<P = {}, S = {}> {
  props: Readonly<P>;
  state: Readonly<S>;
  setState: (
    partialState: Partial<S> | ((state: S, props: P) => Partial<S>),
    callback?: Function
  ) => void;
  render: () => ReactElement;
  componentWillMount?: () => void;
  componentDidMount?: () => void;
  componentWillReceiveProps?: (nextProps: P) => void;
  shouldComponentUpdate?: (nextProps: P, nextState: S) => boolean;
  componentWillUpdate?: (nextProps: P, nextState: S) => void;
  componentDidUpdate?: (prevProps: P, prevState: S) => void;
  componentWillUnmount?: () => void;
}

export interface IReactComponent {
  _curElement: Child;
  _mountIndex: number;
  mountComponent: (transaction: IMountTransaction) => HTMLElement | Text;
  receiveComponent: (transaction: IMountTransaction, nextEl: Child) => void;
  unmountComponent: () => void;
  getHostNode: () => HTMLElement | Text;
}

export interface IReactClassComponent extends IReactComponent {
  _curElement: ReactElement;
  _instance: IComponent;
  _pendingStates: Array<Object | Function>;
  _pendingCallbacks: Array<Function>;
  _mountOrder: number;
  updateComponent: (
    transaction: IMountTransaction,
    prevEl: ReactElement,
    nextEl: ReactElement
  ) => void;
  processPendingStates: () => object;
  updateComponentIfNecessary: (transaction: IMountTransaction) => void;
}

interface IMountTransaction {
  perform: (fn: Function, context: any, ...args) => any;
  enqueue: (fn: Function) => void;
}
