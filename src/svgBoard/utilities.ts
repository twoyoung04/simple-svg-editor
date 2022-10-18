import { NS } from "./namespaces";

export const generateSvgElement = (docuemnt: Document, attributes?: any) => {
  let ele = docuemnt.createElementNS(NS.SVG, "svg") as SVGElement;
  if (!attributes) return;
  Object.keys(attributes).forEach((key) => {
    ele.setAttribute(key, attributes[key]);
  });
  return ele;
};

export const setAttr = (element: Element, attr: any) => {
  Object.keys(attr).forEach((key) => {
    element.setAttribute(key, attr[key]);
  });
};
