import { ReactType, ReactElement, Child } from "./interfaces";
import Component from "./Component";

function createElement(
  type: ReactElement["type"],
  config: { [key: string]: any } = {},
  ...children: Array<Child>
): ReactElement {
  let key = null;
  if (config.key !== undefined) {
    key = "" + config.key;
  }
  const props: ReactElement["props"] = { ...config };
  delete props.key;
  props.children = children.length ? [...children] : [];
  const _rtype = chooseReactType(type);
  return new ReactElement({
    _rtype,
    type,
    props,
    key
  });
}

export default createElement;

function chooseReactType(type: ReactElement["type"]): ReactType {
  if (typeof type === "string") {
    return ReactType.Dom;
  }
  if (type.prototype instanceof Component) {
    return ReactType.Class;
  }
  if (typeof type === "function") {
    return ReactType.Functional;
  }
  console.error("invalid type");
}
