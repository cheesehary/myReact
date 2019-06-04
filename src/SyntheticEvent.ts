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
  document.addEventListener(eventType, _dispatchEvent);
}

function _dispatchEvent(nativeEvt: Event) {
  const targetNode = nativeEvt.target;
  
}
