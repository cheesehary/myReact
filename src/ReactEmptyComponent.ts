import ReactComponent from './ReactComponent';

export default class ReactEmptyComponent extends ReactComponent {
  private _hostNode: Comment;

  constructor() {
    super(null);
  }

  mountComponent(): Comment {
    const node = document.createComment('ReactEmpty');
    this._hostNode = node;
    return node;
  }

  receiveComponent() {}

  getHostNode(): Comment {
    return this._hostNode;
  }

  unmountComponent() {
    this._hostNode = null;
  }
}