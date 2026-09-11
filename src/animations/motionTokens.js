import { Easing } from 'react-native-reanimated';

// One source of truth for motion, so screens don't each invent their own timings
// and drift apart. Values are tuned against Login's existing entrance, which is
// the app's established feel.
export const duration = {
  fast: 160,
  base: 240,
  slow: 420,
  count: 900,
};

export const stagger = {
  step: 70,
};

export const distance = {
  rise: 12,
};

export const easing = {
  out: Easing.out(Easing.cubic),
  inOut: Easing.inOut(Easing.quad),
};

export const spring = {
  soft: { damping: 18, stiffness: 110 },
  pop: { damping: 12, stiffness: 180 },
};

export default { duration, stagger, distance, easing, spring };
