import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { duration as durations, easing } from '../../animations/motionTokens';

// A progress bar that sweeps to its value instead of appearing already filled.
// The sweep is what communicates "this is a proportion" — a static fill just
// reads as a coloured rectangle.
export default function AnimatedBar({
  pct,
  trackStyle,
  fillStyle,
  delay = 0,
  duration = durations.slow,
}) {
  const progress = useSharedValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const target = Math.max(0, Math.min(Number(pct) || 0, 100));
    if (reduced) {
      progress.value = target;
      return;
    }
    progress.value = withDelay(
      delay,
      withTiming(target, { duration, easing: easing.out })
    );
  }, [pct, delay, duration, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <View style={trackStyle}>
      <Animated.View style={[fillStyle, animatedStyle]} />
    </View>
  );
}
