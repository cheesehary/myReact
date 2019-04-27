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
  (props: Readonly<P>): void;
  props: Readonly<P>;
  state: Readonly<S>;
  setState: (partialState: Partial<S>) => void;
  render: () => ReactElement;
  componentWillMount: () => void;
}
