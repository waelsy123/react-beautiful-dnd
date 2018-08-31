// @flow
import type { Position } from 'css-box-model';
import invariant from 'tiny-invariant';
import getDraggablesInsideDroppable from '../../../get-draggables-inside-droppable';
import withDroppableDisplacement from '../../../with-droppable-displacement';
import { add, patch } from '../../../position';
import type { Args, Result } from '../move-to-next-location-types';
import type {
  DraggableId,
  DraggableLocation,
  DraggableDimension,
  Displacement,
  Axis,
  DragImpact,
  DisplacedBy,
  GroupingImpact,
} from '../../../../types';

export default ({
  isMovingForward,
  critical,
  previousPageBorderBoxCenter,
  previousImpact,
  droppable,
  draggables,
  viewport,
}: Args): ?Result => {
  if (!droppable.isGroupingEnabled) {
    return null;
  }

  // Was previously grouping. Can now move into reordering
  if (previousImpact.group) {
    console.log('previous group, doing nothing');
    return null;
  }

  const location: ?DraggableLocation = previousImpact.destination;
  invariant(location, 'Expected a previous location for grouping');

  const insideDroppable: DraggableDimension[] = getDraggablesInsideDroppable(
    droppable,
    draggables,
  );

  const currentIndex: number = location.index;
  const groupingWithIndex = isMovingForward
    ? currentIndex + 1
    : currentIndex - 1;

  // cannot group with anything past the last item
  if (groupingWithIndex > insideDroppable.length - 1) {
    return null;
  }

  // Cannot group backwards as there is nothing there
  if (groupingWithIndex < 0) {
    return null;
  }

  const axis: Axis = droppable.axis;
  const draggable: DraggableDimension = draggables[critical.draggable.id];
  const crossAxisSize: number = draggable.client.borderBox[axis.crossAxisSize];
  const crossAxisShift: number = crossAxisSize * 0.05;
  const groupingWith: DraggableDimension = insideDroppable[groupingWithIndex];

  // TODO: also move slightly on cross axis
  const newPageBorderBoxCenter: Position = add(
    groupingWith.page.borderBox.center,
    patch(droppable.axis.crossAxisLine, crossAxisShift),
  );

  const group: GroupingImpact = {
    // TODO: make accurate
    whenEntered: {
      vertical: isMovingForward ? 'down' : 'up',
      horizontal: isMovingForward ? 'right' : 'left',
    },
    groupingWith: {
      droppableId: droppable.descriptor.id,
      draggableId: groupingWith.descriptor.id,
    },
  };
  const impact: DragImpact = {
    ...previousImpact,
    destination: null,
    group,
  };

  return {
    pageBorderBoxCenter: withDroppableDisplacement(
      droppable,
      newPageBorderBoxCenter,
    ),
    impact,
    // TODO: figure this out
    scrollJumpRequest: null,
  };
};
