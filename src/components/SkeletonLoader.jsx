import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import useShimmerPulse from '../animations/useShimmerPulse';

export default function SkeletonBox({ width, height, borderRadius = 8, style }) {
  const pulse = useShimmerPulse();

  return (
    <Animated.View
      style={[
        styles.bone,
        { width, height, borderRadius },
        pulse,
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
