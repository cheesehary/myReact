import { ReactType, ReactElement, ChildrenProp, Component } from "./interfaces";

function createElement(
  type: ReactElement["type"],
  config = {},
  ...children: Array<ChildrenProp>
): ReactElement {
  const props: ReactElement["props"] = { ...config };
  props.children = children.length ? [...children] : [];
  const _rtype = chooseReactType(type);
  return new ReactElement({
    _rtype,
    type,
    props
  });
}

export default createElement;

function chooseReactType(type: ReactElement["type"]): ReactType {
  if (typeof type === "string") {
    return ReactType.Dom;
  }
  if (typeof type === "function" && !!type.prototype.render) {
    return ReactType.Class;
  }
  if (typeof type === "function") {
    return ReactType.Functional;
  }
  console.error("invalid type");
}
