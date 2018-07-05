// @flow
import { dragHandle } from '../../data-attributes';
import type { HTMLOrSVGElement } from '../../svg-element-type';

const selector: string = `[${dragHandle}]`;

// If called when the component is disabled then the data
// attribute will not be present
export default (draggableRef: HTMLOrSVGElement): ?HTMLOrSVGElement => {
  if (draggableRef.hasAttribute(dragHandle)) {
    return draggableRef;
  }

  // find the first nested drag handle
  // querySelector will return the first match on a breadth first search which is what we want
  // Search will fail when the drag handle is disabled
  // https://codepen.io/alexreardon/pen/erOqyZ
  const el: ?HTMLOrSVGElement = draggableRef.querySelector(selector);

  return el || null;
};
