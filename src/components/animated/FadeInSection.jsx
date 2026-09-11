import React from 'react';
import Animated from 'react-native-reanimated';
import useStaggerIn from '../../animations/useStaggerIn';

// Wraps one block of a screen so it fades up into place. Pass its position via
// `index` and a column of these arrives as a cascade.
export default function FadeInSection({ index = 0, delay = 0, rise, step, style, children }) {
  const animatedStyle = useStaggerIn(index, { delay, rise, step });

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
