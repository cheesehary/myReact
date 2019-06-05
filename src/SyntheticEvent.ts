import { batchUpdate } from "./reconciler";
import {IReactDOMComponent} from './interfaces';

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
    if(ListenerMap[eventType] && ListenerMap[eventType][key]) {
      eventQueue.push(new SyntheticEvent())
    }
  })
}

function findParentComponents(node: HTMLElement): Array<IReactDOMComponent> {

}

class SyntheticEvent {
  public type: string;
  public target: any;
  public currentTarget: any;
  private listener: Function;

  constructor(nativeEvt: Event, component: IReactDOMComponent) {
    this.type = nativeEvt.type;
    this.target = nativeEvt.target;
    this.currentTarget = component.getHostNode();
    // this.listener = 
  }
}
