import React from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { spring } from '../../animations/motionTokens';

// Press feedback for cards and buttons. Reads better than activeOpacity at card
// size, where dimming a large rectangle looks like a glitch rather than a press.
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
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        if (!reduced) pressed.value = withSpring(1, spring.pop);
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, spring.pop);
      }}
      {...rest}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}
