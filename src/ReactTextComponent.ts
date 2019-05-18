import ReactComponent from "./ReactComponent";
import { MountTransaction } from "./reconciler";

export default class ReactTextComponent extends ReactComponent {
  public _curElement: number | string;
  private _hostNode: Text;

  constructor(reactEl: number | string) {
    super(reactEl);
  }

  mountComponent(): Text {
    const element = this._curElement;
    const node = document.createTextNode(element.toString());
    this._hostNode = node;
    return node;
  }

  receiveComponent(transaction: MountTransaction, nextEl: string | number) {
    const prevEl = this._curElement;
    if (prevEl === nextEl) {
      return;
    }
    this._curElement = nextEl;
    this.replaceText(nextEl);
  }

  replaceText(nextEl: string | number) {
    const prevNode = this._hostNode;
    const parentNode = prevNode.parentNode;
    const node = document.createTextNode(nextEl.toString());
    parentNode.insertBefore(node, prevNode);
    parentNode.removeChild(prevNode);
    this._hostNode = node;
  }

  getHostNode() {
    return this._hostNode;
  }

  unmountComponent() {
    this._curElement = null;
    this._hostNode = null;
  }
}
