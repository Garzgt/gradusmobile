import React, { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { duration as durations } from '../../animations/motionTokens';

// Counts a headline figure up from zero. Driven from JS rather than the UI thread
// because the value being animated is text content, not a style, and it is one
// node on the screen.
export default function CountUpNumber({
  value,
  decimals = 2,
  duration = durations.count,
  placeholder = '\u2014',
  style,
}) {
  const target = value == null || value === '' ? null : Number(value);
  const valid = target != null && Number.isFinite(target);

  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(valid && !reduced ? 0 : target);
  const frame = useRef(null);

  useEffect(() => {
    if (!valid) {
      setDisplay(null);
      return undefined;
    }
    if (reduced) {
      setDisplay(target);
      return undefined;
    }

    const start = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(target * eased);
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);

    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, valid, duration, reduced]);

  return (
    <Text style={style}>
      {display == null ? placeholder : display.toFixed(decimals)}
    </Text>
  );
}
