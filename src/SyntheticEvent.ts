import { batchUpdate } from "./reconciler";
import { IReactDOMComponent } from "./interfaces";
import { NodeComponentMap } from "./ReactMap";

const ListenerMap: { [eventType: string]: { [key: string]: Function } } = {};
const isListening: { [eventType: string]: boolean } = {};

export function setListener(
  key: number,
  eventType: string,
  listener: Function
) {
  const typeMap = ListenerMap[eventType] || (ListenerMap[eventType] = {});
  typeMap[key] = listener;
}

export function deleteListener(key: number, eventType: string) {
  const typeMap = ListenerMap[eventType];
  delete typeMap[key];
}

export function deleteAllListenersOfComponent(key: number) {
  Object.values(ListenerMap).forEach(typeMap => {
    delete typeMap[key];
  });
}

export function listenTo(eventType: string) {
  if (isListening[eventType]) {
    return;
  }
  isListening[eventType] = true;
  document.addEventListener(eventType, function(nativeEvt) {
    batchUpdate(dispatchNativeEvent, nativeEvt);
  });
}

function dispatchNativeEvent(nativeEvt: Event) {
  const targetNode = nativeEvt.target;
  const parentComponents = findParentComponents(targetNode as HTMLElement);
  const eventQueue: Array<SyntheticEvent> = [];
  parentComponents.forEach(component => {
    const eventType = nativeEvt.type;
    const key = component.getUniKey();
    const listener = ListenerMap[eventType] && ListenerMap[eventType][key];
    if (listener) {
      eventQueue.push(
        new SyntheticEvent(nativeEvt, component.getHostNode(), listener)
      );
    }
  });
  eventQueue.forEach(event => {
    try {
      const listener = event.getListener();
      listener(event);
    } catch (e) {
      console.error(e);
    }
  });
}

function findParentComponents(node: HTMLElement): Array<IReactDOMComponent> {
  const parents: Array<IReactDOMComponent> = [];
  let current = NodeComponentMap.get(node);
  while (current) {
    parents.push(current);
    current = current._parentComponent;
  }
  return parents;
}

class SyntheticEvent {
  public type: string;
  public target: any;
  public currentTarget: any;
  private listener: Function;

  constructor(
    nativeEvt: Event,
    currentTarget: HTMLElement,
    listener: Function
  ) {
    this.type = nativeEvt.type;
    this.target = nativeEvt.target;
    this.currentTarget = currentTarget;
    this.listener = listener;
  }

  getListener() {
    return this.listener;
  }
}
