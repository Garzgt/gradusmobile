import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export default function SkeletonBox({ width, height, borderRadius = 8, style }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.bone,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonRow({ widths = [], height = 12, gap = 8 }) {
  return (
    <View style={{ flexDirection: 'row', gap }}>
      {widths.map((w, i) => (
        <SkeletonBox key={i} width={w} height={height} borderRadius={6} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bone: {
    backgroundColor: '#D8E8F5',
  },
});
