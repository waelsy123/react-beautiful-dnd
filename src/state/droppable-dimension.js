// @flow
import invariant from 'tiny-invariant';
import {
  getRect,
  type BoxModel,
  type Position,
  type Rect,
  type Spacing,
} from 'css-box-model';
import { vertical, horizontal } from './axis';
import { subtract, negate, origin } from './position';
import { offsetByPosition } from './spacing';
import getMaxScroll from './get-max-scroll';
import type {
  DroppableDimension,
  DroppableDescriptor,
  Scrollable,
  DroppableSubject,
  Axis,
} from '../types';

export const clip = (frame: Spacing, subject: Spacing): ?Rect => {
  const result: Rect = getRect({
    top: Math.max(subject.top, frame.top),
    right: Math.min(subject.right, frame.right),
    bottom: Math.min(subject.bottom, frame.bottom),
    left: Math.max(subject.left, frame.left),
  });

  if (result.width <= 0 || result.height <= 0) {
    return null;
  }

  return result;
};

export type Closest = {|
  client: BoxModel,
  page: BoxModel,
  scrollHeight: number,
  scrollWidth: number,
  scroll: Position,
  shouldClipSubject: boolean,
|};

type GetDroppableArgs = {|
  descriptor: DroppableDescriptor,
  isEnabled: boolean,
  direction: 'vertical' | 'horizontal',
  client: BoxModel,
  page: BoxModel,
  closest?: ?Closest,
|};

type GetSubjectArgs = {|
  pageMarginBox: Rect,
  withPlaceholderSize: Position,
  axis: Axis,
  scrollDisplacement: Position,
  frame: ?Scrollable,
|};

const getSubject = ({
  pageMarginBox,
  withPlaceholderSize,
  axis,
  scrollDisplacement,
  frame,
}: GetSubjectArgs): DroppableSubject => {
  const scrolled: Spacing = offsetByPosition(pageMarginBox, scrollDisplacement);
  const expanded: Spacing = {
    ...scrolled,
    [axis.end]: scrolled[axis.end] + withPlaceholderSize[axis.line],
  };
  const clipped: ?Rect =
    frame && frame.shouldClipSubject
      ? clip(frame.pageMarginBox, expanded)
      : getRect(expanded);

  return {
    pageMarginBox,
    withPlaceholderSize,
    active: clipped,
  };
};

export const getDroppableDimension = ({
  descriptor,
  isEnabled,
  direction,
  client,
  page,
  closest,
}: GetDroppableArgs): DroppableDimension => {
  const frame: ?Scrollable = (() => {
    if (!closest) {
      return null;
    }

    // scrollHeight and scrollWidth are based on the padding box
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight
    const maxScroll: Position = getMaxScroll({
      scrollHeight: closest.scrollHeight,
      scrollWidth: closest.scrollWidth,
      height: closest.client.paddingBox.height,
      width: closest.client.paddingBox.width,
    });

    return {
      pageMarginBox: closest.page.marginBox,
      shouldClipSubject: closest.shouldClipSubject,
      scroll: {
        initial: closest.scroll,
        current: closest.scroll,
        max: maxScroll,
        diff: {
          value: origin,
          displacement: origin,
        },
      },
    };
  })();

  const subjectPageMarginBox: Rect = page.marginBox;
  const axis: Axis = direction === 'vertical' ? vertical : horizontal;

  const subject: DroppableSubject = getSubject({
    pageMarginBox: subjectPageMarginBox,
    withPlaceholderSize: origin,
    axis,
    scrollDisplacement: origin,
    frame,
  });

  const dimension: DroppableDimension = {
    descriptor,
    axis,
    isEnabled,
    client,
    page,
    frame,
    subject,
  };

  return dimension;
};

export const withPlaceholder = (
  droppable: DroppableDimension,
  withPlaceholderSize: Position,
): DroppableDimension => {
  const subject: DroppableSubject = getSubject({
    pageMarginBox: droppable.subject.pageMarginBox,
    withPlaceholderSize,
    axis: droppable.axis,
    scrollDisplacement: droppable.frame
      ? droppable.frame.scroll.diff.displacement
      : origin,
    frame: droppable.frame,
  });
  return {
    ...droppable,
    subject,
  };
};

export const withoutPlaceholder = (
  droppable: DroppableDimension,
): DroppableDimension => {
  const subject: DroppableSubject = getSubject({
    pageMarginBox: droppable.subject.pageMarginBox,
    withPlaceholderSize: origin,
    axis: droppable.axis,
    scrollDisplacement: droppable.frame
      ? droppable.frame.scroll.diff.displacement
      : origin,
    frame: droppable.frame,
  });
  return {
    ...droppable,
    subject,
  };
};

export const scrollDroppable = (
  droppable: DroppableDimension,
  newScroll: Position,
): DroppableDimension => {
  invariant(droppable.frame);

  const scrollable: Scrollable = droppable.frame;

  const scrollDiff: Position = subtract(newScroll, scrollable.scroll.initial);
  // a positive scroll difference leads to a negative displacement
  // (scrolling down pulls an item upwards)
  const scrollDisplacement: Position = negate(scrollDiff);

  // Sometimes it is possible to scroll beyond the max point.
  // This can occur when scrolling a foreign list that now has a placeholder.

  const frame: Scrollable = {
    pageMarginBox: scrollable.pageMarginBox,
    shouldClipSubject: scrollable.shouldClipSubject,
    scroll: {
      initial: scrollable.scroll.initial,
      current: newScroll,
      diff: {
        value: scrollDiff,
        displacement: scrollDisplacement,
      },
      // TODO: rename 'softMax?'
      max: scrollable.scroll.max,
    },
  };
  const subject: DroppableSubject = getSubject({
    pageMarginBox: droppable.subject.pageMarginBox,
    withPlaceholderSize: droppable.subject.withPlaceholderSize,
    axis: droppable.axis,
    scrollDisplacement,
    frame,
  });
  const result: DroppableDimension = {
    ...droppable,
    frame,
    subject,
  };
  return result;
};
