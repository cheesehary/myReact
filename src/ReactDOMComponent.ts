import { ReactElement, Child, UpdateType } from "./interfaces";
import { ReservedProps, ListenerProps } from "./dom";
import ReactComponent from "./ReactComponent";
import { MountTransaction } from "./reconciler";
import { listenTo, setListener } from "./SyntheticEvent";

let nextUniKey = 0;
const internalComponent = "_ReactDOMComponent";

export default class ReactDOMComponent extends ReactComponent {
  public _curElement: ReactElement;
  private _hostNode: HTMLElement;
  private _renderedChildren: { [index: string]: ReactComponent };
  private _uniKey: number;

  constructor(reactEl: ReactElement) {
    super(reactEl);
  }

  mountComponent(transaction: MountTransaction): HTMLElement {
    this._uniKey = nextUniKey++;
    const element = this._curElement;
    const node = document.createElement(element.type as string);
    node[internalComponent] = this;
    this._hostNode = node;
    this.updateDOMProps(transaction, null, element.props);
    this.mountChildren(transaction, element.props.children);
    return node;
  }

  receiveComponent(transaction: MountTransaction, nextEl: ReactElement) {
    const prevEl = this._curElement;
    this.updateDOMProps(transaction, prevEl.props, nextEl.props);
    this.updateChildren(transaction, nextEl.props.children);
  }

  updateChildren(transaction: MountTransaction, children: Array<Child>) {
    const prevChildren = this._renderedChildren;
    const nextElements: { [index: string]: Child } = {};
    children.forEach((child, i) => {
      const index = this.getChildIndex(child, i);
      nextElements[index] = child;
    });
    const nextChildren: { [index: string]: ReactComponent } = {};
    const queue: Array<{
      type: UpdateType;
      node: HTMLElement | Text;
      afterNode?: HTMLElement | Text;
    }> = [];
    this.diff(transaction, prevChildren, nextElements, nextChildren, queue);
    this._renderedChildren = nextChildren;
    this.processQueue(this.getHostNode(), queue);
  }

  processQueue(
    parentNode: HTMLElement,
    queue: Array<{
      type: UpdateType;
      node: HTMLElement | Text;
      afterNode?: HTMLElement | Text;
    }>
  ) {
    queue.forEach(({ type, node, afterNode }) => {
      switch (type) {
        case UpdateType.Remove: {
          parentNode.removeChild(node);
          break;
        }
        case UpdateType.Insert: {
          const referenceNode = afterNode
            ? afterNode.nextSibling
            : parentNode.firstChild;
          parentNode.insertBefore(node, referenceNode);
          break;
        }
      }
    });
  }

  diff(
    transaction: MountTransaction,
    prevChildren: { [index: string]: ReactComponent },
    nextElements: { [index: string]: Child },
    nextChildren: { [index: string]: ReactComponent },
    queue: Array<{
      type: UpdateType;
      node: HTMLElement | Text;
      afterNode?: HTMLElement | Text;
    }>
  ) {
    const unmountQueue: Array<ReactComponent> = [];
    let lastNode: HTMLElement | Text = null;
    let lastIndex = 0;
    Object.entries(nextElements).forEach(([index, nextEl], i) => {
      const prevComponent = prevChildren[index];
      if (
        prevComponent &&
        this.onlyUpdateComponent(prevComponent._curElement, nextEl)
      ) {
        prevComponent.receiveComponent(transaction, nextEl);
        if (prevComponent._mountIndex < lastIndex) {
          queue.push({
            type: UpdateType.Insert,
            node: prevComponent.getHostNode(),
            afterNode: lastNode
          });
        }
        lastNode = prevComponent.getHostNode();
        lastIndex = Math.max(lastIndex, prevComponent._mountIndex);
        prevComponent._mountIndex = i;
        nextChildren[index] = prevComponent;
      } else {
        if (prevComponent) {
          queue.push({
            type: UpdateType.Remove,
            node: prevComponent.getHostNode()
          });
          unmountQueue.push(prevComponent);
          lastIndex = Math.max(lastIndex, prevComponent._mountIndex);
        }
        const nextComponent = this._instantiateComponent(nextEl);
        nextComponent._parentComponent = this;
        nextComponent._mountIndex = i;
        const nextNode = nextComponent.mountComponent(transaction);
        queue.push({
          type: UpdateType.Insert,
          node: nextNode,
          afterNode: lastNode
        });
        lastNode = nextNode;
        nextChildren[index] = nextComponent;
      }
    });
    Object.entries(prevChildren).forEach(([index, prevComponent]) => {
      if (!nextChildren.hasOwnProperty(index)) {
        queue.push({
          type: UpdateType.Remove,
          node: prevComponent.getHostNode()
        });
        unmountQueue.push(prevComponent);
      }
    });
    unmountQueue.forEach(component => component.unmountComponent());
  }

  updateDOMProps(transaction: MountTransaction, prevProps, nextProps) {
    const node = this.getHostNode();
    for (let propKey in prevProps) {
      if (
        nextProps.hasOwnProperty(propKey) ||
        !prevProps.hasOwnProperty(propKey) ||
        prevProps[propKey] == null
      ) {
        continue;
      }
      if (
        ListenerProps.hasOwnProperty(propKey) &&
        typeof prevProps[propKey] === "function"
      ) {
        node.removeEventListener(ListenerProps[propKey], prevProps[propKey]);
      } else {
        node.removeAttribute(propKey);
      }
    }
    for (let propKey in nextProps) {
      if (
        ReservedProps.hasOwnProperty(propKey) ||
        !nextProps.hasOwnProperty(propKey)
      ) {
        continue;
      }
      if (
        ListenerProps.hasOwnProperty(propKey) &&
        typeof nextProps[propKey] === "function"
      ) {
        if (prevProps && prevProps[propKey]) {
          node.removeEventListener(ListenerProps[propKey], prevProps[propKey]);
        }
        node.addEventListener(ListenerProps[propKey], nextProps[propKey]);
        listenTo(ListenerProps[propKey]);
        transaction.enqueue(
          setListener.bind(
            null,
            this._uniKey,
            ListenerProps[propKey],
            nextProps[propKey]
          )
        );
      } else {
        node.setAttribute(propKey, nextProps[propKey]);
      }
    }
  }

  mountChildren(transaction: MountTransaction, children: Array<Child>) {
    const node = this.getHostNode();
    if (children.length) {
      if (!this._renderedChildren) {
        this._renderedChildren = {};
      }
      children.forEach((child, i) => {
        const childComponent = this._instantiateComponent(child);
        childComponent._parentComponent = this;
        const index = this.getChildIndex(child, i);
        this._renderedChildren[index] = childComponent;
        childComponent._mountIndex = i;
        const childNode = childComponent.mountComponent(transaction);
        node.appendChild(childNode);
      });
    }
  }

  getChildIndex = (reactEl: Child, nextIndex: number): string => {
    if (reactEl instanceof ReactElement && reactEl.key !== null) {
      return reactEl.key;
    }
    return "" + nextIndex;
  };

  getHostNode(): HTMLElement {
    return this._hostNode;
  }

  getComponentFromNode(node: HTMLElement): ReactDOMComponent {
    return node[internalComponent];
  }

  getUniKey(): number {
    return this._uniKey;
  }

  unmountComponent() {
    const node = this.getHostNode();
    const props = this._curElement.props;
    for (let propKey in props) {
      if (
        ListenerProps.hasOwnProperty(propKey) &&
        typeof props[propKey] === "function"
      ) {
        node.removeEventListener(ListenerProps[propKey], props[propKey]);
      }
    }
    const renderedChildren = this._renderedChildren;
    for (let index in renderedChildren) {
      renderedChildren[index].unmountComponent();
    }
    this._curElement = null;
    this._renderedChildren = null;
    this._hostNode = null;
    node[internalComponent] = null;
  }
}
