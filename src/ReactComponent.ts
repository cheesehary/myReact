import { Child, ReactElement, IReactDOMComponent } from "./interfaces";
import { MountTransaction } from "./reconciler";

export default abstract class ReactComponent {
  protected _instantiateComponent: (reactEl: Child) => ReactComponent;
  public _curElement: Child;
  public _mountIndex: number;
  public _parentComponent: IReactDOMComponent;

  constructor(reactEl: Child) {
    this._curElement = reactEl;
  }
  abstract mountComponent(transaction: MountTransaction): HTMLElement | Text;
  abstract receiveComponent(transaction: MountTransaction, nextEl: Child): void;
  abstract unmountComponent(): void;
  abstract getHostNode(): HTMLElement | Text;
  protected onlyUpdateComponent(prevEl: Child, nextEl: Child): boolean {
    if (!prevEl && !nextEl) {
      return true;
    }
    if (!prevEl || !nextEl) {
      return false;
    }
    if (typeof prevEl === "string" || typeof prevEl === "number") {
      return typeof nextEl === "string" || typeof nextEl === "number";
    } else {
      return (
        nextEl instanceof ReactElement &&
        prevEl.type === nextEl.type &&
        prevEl.key === nextEl.key
      );
    }
  }
}
