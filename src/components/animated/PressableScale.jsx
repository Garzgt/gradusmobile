import React from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { spring } from '../../animations/motionTokens';

// Single animated node rather than a styled child inside a plain Pressable: the
// style has to land on the same element the parent lays out, or flex:1 and
// full-width styles apply to an inner view while the touchable shrinks to its
// content.
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PressableScale({
  scaleTo = 0.97,
  style,
  children,
  onPress,
  ...rest
}) {
  const pressed = useSharedValue(0);
  const reduced = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - scaleTo) }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        if (!reduced) pressed.value = withSpring(1, spring.pop);
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, spring.pop);
      }}
      style={[style, animatedStyle]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
