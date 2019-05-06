import { ReactElement } from "./interfaces";
import ReactInstanceMap from "./ReactInstanceMap";

export default abstract class Component<P = {}, S = {}> {
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
  abstract render(): ReactElement;
}
