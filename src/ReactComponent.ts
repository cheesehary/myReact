import { Child, ReactElement } from "./interfaces";

export default abstract class ReactComponent {
  protected _instantiateComponent: (reactEl: Child) => ReactComponent;
  public _curElement: Child;
  public _hostNode: HTMLElement | Text;
  public _mountIndex: number;

  constructor(reactEl: Child) {
    this._curElement = reactEl;
  }
  abstract mountComponent(): HTMLElement | Text;
  abstract receiveComponent(nextEl: Child): void;
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
