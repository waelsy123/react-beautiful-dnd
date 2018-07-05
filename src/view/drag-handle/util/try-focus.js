// @flow
import invariant from 'tiny-invariant';
import type { SVGElement } from '../../svg-element-type';

export default (el: HTMLElement | SVGElement) => {
  // $FlowFixMe - unknown property .focus
  if (el.focus) {
    el.focus();
    return;
  }

  // Try to borrow HTMLElement focus
  // Idea taken from here:
  // - https://allyjs.io/tutorials/focusing-in-svg.html#focusing-svg-elements
  // - https://github.com/medialize/ally.js/blob/88e1af44df20df3209afe377aa4e9d21ef426ff2/src/element/focus.js
  try {
    HTMLElement.prototype.focus.call(el);
  } catch (e) {
    invariant(
      false,
      `Unable to focus on SVGElement drag handle.
      Consider wrapping your drag handle in a HTMLElement for improved browser support`,
    );
  }
};
