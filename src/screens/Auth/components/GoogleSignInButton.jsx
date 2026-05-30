import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import styles from './GoogleSignInButton.styles';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function GoogleSignInButton({ onPress, loading }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedTouchable
      style={[styles.button, animatedStyle, loading && styles.buttonDisabled]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={loading}
      activeOpacity={1}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#2A7AB6" />
      ) : (
        <View style={styles.inner}>
          <View style={styles.iconWrapper}>
            <AntDesign name="google" size={20} color="#DB4437" />
          </View>
          <Text style={styles.text}>Continue with Google</Text>
        </View>
      )}
    </AnimatedTouchable>
  );
}
