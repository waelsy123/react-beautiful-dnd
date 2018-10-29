// @flow

// cannot use instanceof SVGElement as the el might be in an iframe
export const isSVG = (el: Object): boolean => el.nodeName === 'svg';

// cannot use instanceof HTMLElement as the el might be in an iframe
export const isHTMLElement = (el: Object): boolean => el.nodeType === 1;
