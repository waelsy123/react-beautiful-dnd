// @flow
import inHomeList from './in-home-list';
import inForeignList from './in-foreign-list';
import type { Args, Result } from '../move-to-next-location-types';

export default (args: Args): ?Result => {
  const { critical, droppable } = args;

  const isInHomeList: boolean =
    critical.draggable.droppableId === droppable.descriptor.id;

  if (isInHomeList) {
    return inHomeList(args);
  }

  return inForeignList(args);
};
