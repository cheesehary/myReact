import { ReactElement } from "./interfaces";
import ReactInstanceMap from "./ReactInstanceMap";
import { enqueueUpdate } from "./reconciler";

export default abstract class Component<P = {}, S = {}> {
  public props: Readonly<P>;
  public state: Readonly<S>;

  constructor(props: Readonly<P>) {
    this.props = props;
  }
  setState(partialState: Partial<S> | Function, callback?: Function) {
    const component = ReactInstanceMap.get(this);
    const queue = component._pendingStates || (component._pendingStates = []);
    queue.push(partialState);
    if (callback) {
      const queue =
        component._pendingCallbacks || (component._pendingCallbacks = []);
      queue.push(callback);
    }
    enqueueUpdate(component);
  }
  abstract render(): ReactElement;
}
