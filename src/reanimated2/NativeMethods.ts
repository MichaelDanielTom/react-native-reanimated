/* global _WORKLET _measure _scrollTo _dispatchCommand _setGestureState */
import { Component } from 'react';
import { findNodeHandle } from 'react-native';
import { MeasuredDimensions } from './commonTypes';
import { RefObjectFunction } from './hook/commonTypes';
import { shouldBeUseWeb } from './PlatformChecker';

export function getTag(
  view: null | number | React.Component<any, any> | React.ComponentClass<any>
): null | number {
  return findNodeHandle(view);
}

const isNative = !shouldBeUseWeb();

export function measure(
  animatedRef: RefObjectFunction<Component>
): MeasuredDimensions | null {
  'worklet';
  if (!isNative) {
    console.warn(
      '[Reanimated] measure() cannot be used on web or Chrome Debugger'
    );
    return null;
  }

  if (!_WORKLET) {
    console.warn(
      '[Reanimated] measure() was called from the main JS context. Measure is ' +
        'only available in the UI runtime. This may also happen if measure() ' +
        'was called by a worklet in the useAnimatedStyle hook, because useAnimatedStyle ' +
        'calls the given worklet on the JS runtime during render. If you want to ' +
        'prevent this warning then wrap the call with `if (_WORKLET)`. Then it will ' +
        'only be called on the UI runtime after the render has been completed.'
    );
    return null;
  }

  const viewTag = animatedRef();
  if (viewTag === -1) {
    console.warn(
      `[Reanimated] The view with tag ${viewTag} is not a valid argument for measure(). This may be because the view is not currently rendered, which may not be a bug (e.g. an off-screen FlatList item).`
    );
    return null;
  }

  const measured = _measure(viewTag);
  if (measured === null) {
    console.warn(
      `[Reanimated] The view with tag ${viewTag} has some undefined, not-yet-computed or meaningless value of \`LayoutMetrics\` type. This may be because the view is not currently rendered, which may not be a bug (e.g. an off-screen FlatList item).`
    );
    return null;
  } else if (measured.x === -1234567) {
    console.warn(
      `[Reanimated] The view with tag ${viewTag} returned an invalid measurement response`
    );
    return null;
  } else if (isNaN(measured.x)) {
    console.warn(
      `[Reanimated] The view with tag ${viewTag} gets view-flattened on Android. To disable view-flattening, set \`collapsable={false}\` on this component.`
    );
    return null;
  } else {
    return measured;
  }
}

export function dispatchCommand(
  animatedRef: RefObjectFunction<Component>,
  commandName: string,
  args: Array<unknown>
): void {
  'worklet';
  if (!_WORKLET || !isNative) {
    return;
  }
  const shadowNodeWrapper = animatedRef();
  _dispatchCommand(shadowNodeWrapper, commandName, args);
}

export let scrollTo: (
  animatedRef: RefObjectFunction<Component>,
  x: number,
  y: number,
  animated: boolean
) => void;

if (global._IS_FABRIC) {
  scrollTo = (
    animatedRef: RefObjectFunction<Component>,
    x: number,
    y: number,
    animated: boolean
  ) => {
    'worklet';
    dispatchCommand(animatedRef, 'scrollTo', [x, y, animated]);
  };
} else {
  scrollTo = (
    animatedRef: RefObjectFunction<Component>,
    x: number,
    y: number,
    animated: boolean
  ) => {
    'worklet';
    if (!_WORKLET || !isNative) {
      return;
    }
    const viewTag = animatedRef();
    _scrollTo(viewTag, x, y, animated);
  };
}

export function setGestureState(handlerTag: number, newState: number): void {
  'worklet';
  if (!_WORKLET || !isNative) {
    console.warn(
      '[Reanimated] You can not use setGestureState in non-worklet function.'
    );
    return;
  }
  _setGestureState(handlerTag, newState);
}
