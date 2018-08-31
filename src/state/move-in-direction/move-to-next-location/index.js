// @flow
import getGroupingResult from './grouping/get-grouping-result';
import getReorderResult from './reorder/get-reorder-result';
import type { Args, Result } from './move-to-next-location-types';

export default (args: Args): ?Result => {
  // Cannot move in list if the list is not enabled (can still cross axis move)
  if (!args.droppable.isEnabled) {
    return null;
  }

  return getGroupingResult(args) || getReorderResult(args);
};
