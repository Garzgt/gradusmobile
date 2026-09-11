import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { duration, easing } from '../../animations/motionTokens';

const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);

// One chevron that rotates, rather than swapping between chevron-up and
// chevron-down icons — the rotation is what makes an accordion feel connected
// to the panel it opens.
export default function AnimatedChevron({ open, size = 15, color = '#8BA4BC', style }) {
  const rotation = useSharedValue(open ? 180 : 0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const target = open ? 180 : 0;
    rotation.value = reduced
      ? target
      : withTiming(target, { duration: duration.base, easing: easing.out });
  }, [open, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <AnimatedIcon
      name="chevron-down"
      size={size}
      color={color}
      style={[style, animatedStyle]}
    />
  );
}
