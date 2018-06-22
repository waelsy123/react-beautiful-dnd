// @flow
import React, { Component } from 'react';
import memoizeOne from 'memoize-one';
import { type Position } from 'css-box-model';
import { Motion, spring } from 'react-motion';
import { physics } from '../animation';
import type { Props, DefaultProps, Style } from './moveable-types';

type PositionLike = {|
  x: any,
  y: any,
|};

const origin: Position = {
  x: 0,
  y: 0,
};

const noTransition: Style = {
  transform: null,
};

const isAtOrigin = (x: mixed, y: mixed): boolean =>
  x === origin.x && y === origin.y;

export default class Movable extends Component<Props> {
  /* eslint-disable react/sort-comp */

  static defaultProps: DefaultProps = {
    destination: origin,
  }
  /* eslint-enable */

  onRest = () => {
    const { onMoveEnd } = this.props;

    if (!onMoveEnd) {
      return;
    }

    // This needs to be async otherwise Motion will not re-execute if
    // offset or start change

    // Could check to see if another move has started
    // and abort the previous onMoveEnd
    setTimeout(onMoveEnd);
  }

  getTranslate = memoizeOne((x: number, y: number): Style => ({
    transform: `translate(${x}px, ${y}px)`,
  }))

  getFinal = (): PositionLike => {
    const destination: Position = this.props.destination;
    const speed = this.props.speed;

    if (speed === 'INSTANT') {
      return destination;
    }

    const selected = speed === 'FAST' ? physics.fast : physics.standard;

    return {
      x: spring(destination.x, selected),
      y: spring(destination.y, selected),
    };
  }

  // renderChildren = (current: { [string]: number }): any => {
  //   const destination: Position = this.props.destination;
  //   // If moving instantly then we can just move straight to the destination
  //   // Sadly react-motion does a double call in this case so we need to explictly control this
  //   if (this.props.speed === 'INSTANT') {
  //     return this.props.children(
  //       this.getTranslate(destination.x, destination.y)
  //     );
  //   }

  //   // If moving to the origin we can just clear the transition
  //   if (isAtOrigin(current)) {
  //     return this.props.children(noTransition);
  //   }

  //   // Rather than having a translate of 0px, 0px we just clear the transition
  //   if (isAtOrigin(destination)) {
  //     return this.props.children(noTransition);
  //   }

  //   return this.props.children(this.getTranslate(current.x, current.y));
  // }

  render() {
    const final: PositionLike = this.getFinal();
    const { speed, destination } = this.props;
    const shouldIgnore: boolean = speed === 'INSTANT' && isAtOrigin(destination);

    // bug with react-motion: https://github.com/chenglou/react-motion/issues/437
    // even if both defaultStyle and style are {x: 0, y: 0 } if there was
    // a previous animation it uses the last value rather than the final value
    const isMovingToOrigin: boolean = isAtOrigin(final);

    return (
      <Motion defaultStyle={origin} style={final} onRest={this.onRest}>
        {(current: { [string]: number }): any => {
          // the default for Draggables
          if (shouldIgnore) {
            return this.props.children(noTransition);
          }

          if (speed === 'INSTANT') {
            return this.props.children(
              this.getTranslate(destination.x, destination.y)
            );
          }
          // Rather than having a translate of 0px, 0px we just clear the transition
          // If moving to the origin we can just clear the transition
          if (isAtOrigin(current)) {
            return this.props.children(noTransition);
          }

          return this.props.children(this.getTranslate(current.x, current.y));
        }}
      </Motion>
    );
  }
}
