export enum ReactType {
  Dom,
  Class,
  Functional
}

export type ChildrenProp = ReactElement | string | number;

export class ReactElement {
  public _rtype: ReactType;
  public type: Function | string;
  public props: { [prop: string]: any };

  constructor({ _rtype, type, props }) {
    this._rtype = _rtype;
    this.type = type;
    this.props = props;
  }
}

export abstract class Component<P={}> {
  public props: P;

  constructor(props) {
    this.props = props;
  }
  abstract render(): ReactElement;
}
