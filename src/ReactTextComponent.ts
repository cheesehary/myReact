import ReactComponent from "./ReactComponent";

export default class ReactTextComponent extends ReactComponent {
  public _curElement: number | string;

  constructor(reactEl: number | string) {
    super(reactEl);
  }

  mountComponent(): Text {
    const element = this._curElement;
    const node = document.createTextNode(element.toString());
    this._hostNode = node;
    return node;
  }

  receiveComponent(nextEl: string | number) {
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
    parentNode.appendChild(node);
  }
}
