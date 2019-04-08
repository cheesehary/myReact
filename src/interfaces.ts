export enum ReactType {
  Dom,
  Class,
  Functional
}

export type ChildrenProp = ReactElement | string | number;

export class ReactElement {
  public _rtype: ReactType;
  public type: Function | SFC | string;
  public props: { [prop: string]: any };

  constructor({ _rtype, type, props }) {
    this._rtype = _rtype;
    this.type = type;
    this.props = props;
  }
}

export interface SFC<P={}> {
  (props: Readonly<P>): ReactElement;
}

export abstract class Component<P={}, S={}> {
  public props: Readonly<P>;
  public state: Readonly<S>;

  constructor(props: Readonly<P>) {
    this.props = props;
  }
  abstract render(): ReactElement;
}
