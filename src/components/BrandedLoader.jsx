import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import colors from '../styles/colors';

const logo = require('../../assets/images/gradus-logo-new.png');

// Sits on the same headerBg as both the native splash and Login, so startup
// reads as one continuous screen instead of three that cut between each other.
function Dot({ delay }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 420, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 420, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      )
    );
  }, [delay]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.28 + progress.value * 0.72,
    transform: [{ scale: 0.82 + progress.value * 0.28 }],
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

export default function BrandedLoader() {
  const enter = useSharedValue(0);
  const breathe = useSharedValue(0);

  useEffect(() => {
    enter.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.ease) });
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ scale: (0.92 + enter.value * 0.08) * (1 + breathe.value * 0.05) }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={logoStyle}>
        <Image source={logo} style={styles.logo} />
      </Animated.View>

      <View style={styles.dots}>
        <Dot delay={0} />
        <Dot delay={140} />
        <Dot delay={280} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.headerBg,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
});
