import { useEffect } from 'react';
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

// The breathing opacity used by skeleton placeholders.
export default function useShimmerPulse(options = {}) {
  const { min = 0.4, max = 1, duration = 700 } = options;

  const progress = useSharedValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      progress.value = 1;
      return;
    }
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration }),
        withTiming(0, { duration })
      ),
      -1,
      false
    );
  }, [reduced, duration]);

  return useAnimatedStyle(() => ({
    opacity: min + progress.value * (max - min),
  }));
}
