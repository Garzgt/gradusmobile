import { useAnimatedStyle, useReducedMotion } from 'react-native-reanimated';

// Scroll-linked drift for an element inside a fixed header. Moving the header
// itself would open a gap above the content, so this is meant for decorative or
// secondary pieces within it.
export default function useParallaxMotion(scrollY, options = {}) {
  const { factor = 0.3, clamp = 160, fadeOver = 0 } = options;
  const reduced = useReducedMotion();

  return useAnimatedStyle(() => {
    if (reduced || !scrollY) {
      return { opacity: 1, transform: [{ translateY: 0 }] };
    }
    const y = Math.min(Math.max(scrollY.value, 0), clamp);
    return {
      opacity: fadeOver > 0 ? 1 - Math.min(y / fadeOver, 1) : 1,
      transform: [{ translateY: y * factor }],
    };
  });
}
