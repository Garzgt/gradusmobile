import { useEffect } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  useReducedMotion,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { distance, duration, easing, stagger } from './motionTokens';

// Entrance for an item in a list or column: fades up into place, offset by its
// position so a group arrives as a cascade instead of all at once.
export default function useStaggerIn(index = 0, options = {}) {
  const {
    step = stagger.step,
    rise = distance.rise,
    delay = 0,
    enabled = true,
  } = options;

  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced || !enabled ? 1 : 0);

  useEffect(() => {
    if (reduced || !enabled) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(
      delay + index * step,
      withTiming(1, { duration: duration.base, easing: easing.out })
    );
  }, [index, step, delay, enabled, reduced]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * rise }],
  }));
}
