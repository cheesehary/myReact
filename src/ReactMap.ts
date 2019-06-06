import {
  IReactClassComponent,
  IComponent,
  IReactDOMComponent
} from "./interfaces";

const internalComponent = "_ReactDOMComponent";

export const InstanceComponentMap = new WeakMap<
  IComponent,
  IReactClassComponent
>();

export class NodeComponentMap {
  static get(node: HTMLElement): IReactDOMComponent {
    return node[internalComponent];
  }

  static set(node: HTMLElement, component: IReactDOMComponent) {
    node[internalComponent] = component;
  }

  static delete(node: HTMLElement) {
    node[internalComponent] = null;
  }
}
